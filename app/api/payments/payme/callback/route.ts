import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
type Rpc = { method?: string; params?: Record<string,unknown>; id?: number|string|null };

function equalSecret(a:string,b:string) {
  const x=Buffer.from(a,"utf8"), y=Buffer.from(b,"utf8");
  return x.length===y.length && timingSafeEqual(x,y);
}
function authorized(request:Request,key:string) {
  const h=request.headers.get("authorization")||"";
  if(!h.startsWith("Basic ")) return false;
  let decoded="";
  try { decoded=Buffer.from(h.slice(6).trim(),"base64").toString("utf8"); } catch { return false; }
  const i=decoded.indexOf(":");
  return i>0 && decoded.slice(0,i)==="Paycom" && equalSecret(decoded.slice(i+1),key);
}
function result(id:Rpc["id"],value:unknown) {
  return NextResponse.json({jsonrpc:"2.0",id:id??null,result:value},{status:200});
}
function fail(id:Rpc["id"],code:number,message:string,data?:unknown) {
  return NextResponse.json({jsonrpc:"2.0",id:id??null,error:{code,message,data}},{status:200});
}
function uuid(v:unknown):v is string {
  return typeof v==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
function ms(v:unknown) { const n=Number(v); return Number.isSafeInteger(n)&&n>=0?n:0; }
type PaymentAttempt = { id: string; order_id?: string; status: string; provider_payment_id?: string | null; provider_payload: unknown; created_at: string; amount_uzs?: number; currency?: string };
type PaymePayload = Record<string, unknown>;
function objectValue(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function stateOf(a: Pick<PaymentAttempt, "status">) {
  if(a.status==="paid") return 2;
  if(a.status==="refunded") return -2;
  if(a.status==="cancelled"||a.status==="failed") return -1;
  return 1;
}
function paymePayload(a: Pick<PaymentAttempt, "provider_payload">): PaymePayload { return objectValue(objectValue(a.provider_payload).payme); }

export async function POST(request:Request) {
  const env=getServerEnv();
  if(env.PAYME_ENABLED !== "true" || !env.PAYME_MERCHANT_ID || !env.PAYME_MERCHANT_KEY) return fail(null,-32400,"Payme is not configured");
  if(!authorized(request,env.PAYME_MERCHANT_KEY)) return fail(null,-32504,"Insufficient privileges");

  let body:Rpc;
  try { body=await request.json() as Rpc; } catch { return fail(null,-32700,"Parse error"); }
  if(!body || typeof body.method!=="string" || !body.params || typeof body.params!=="object") {
    return fail(body?.id,-32600,"Invalid RPC request");
  }
  const params=body.params;
  const db=createServiceRoleClient();
  try {
    if(body.method==="CheckPerformTransaction") {
      const account=params.account as Record<string,unknown>|undefined;
      const orderId=account?.order_id;
      const amount=ms(params.amount);
      if(!uuid(orderId)) return fail(body.id,-31050,"Order not found","order_id");
      const {data:order,error}=await db.from("monetization_orders")
        .select("id,status,total_amount,currency,payment_provider").eq("id",orderId).maybeSingle();
      if(error) throw error;
      if(!order) return fail(body.id,-31050,"Order not found","order_id");
      if(order.currency!=="UZS" || Math.round(Number(order.total_amount)*100)!==amount) return fail(body.id,-31001,"Incorrect amount");
      if(order.status!=="pending" || order.payment_provider!=="payme") return fail(body.id,-31008,"Operation is not allowed");
      return result(body.id,{allow:true});
    }

    if(body.method==="CreateTransaction") {
      const transactionId=typeof params.id==="string"?params.id:"";
      const time=ms(params.time), amount=ms(params.amount);
      const account=params.account as Record<string,unknown>|undefined;
      const orderId=account?.order_id;
      if(!transactionId || !time || !uuid(orderId)) return fail(body.id,-31050,"Order not found","order_id");

      const {data:existing,error:existingError}=await db.from("monetization_payment_attempts")
        .select("id,order_id,status,provider_payment_id,provider_payload,created_at")
        .eq("provider","payme").eq("provider_payment_id",transactionId).maybeSingle();
      if(existingError) throw existingError;
      if(existing) {
        const original=paymePayload(existing);
        if(existing.order_id!==orderId || Number(original.amount)!==amount) return fail(body.id,-31001,"Incorrect amount");
        return result(body.id,{create_time:Number(original.create_time||Date.parse(existing.created_at)),transaction:existing.id,state:stateOf(existing)});
      }

      const {data:bound,error}=await db.rpc("bind_payme_monetization_transaction",{
        p_order_id:orderId,
        p_payme_transaction_id:transactionId,
        p_amount_tiyin:amount,
        p_payme_payload:{id:transactionId,time,amount,account,create_time:Date.now(),state:1},
      });
      if(error) throw error;
      const row=Array.isArray(bound)?bound[0]:bound;
      if(!row || Number(row.error_code)!==0) {
        const code=Number(row?.error_code||-31008);
        return fail(body.id,code,code===-31001?"Incorrect amount":code===-31050?"Order not found":code===-31099?"Other transaction for this order is in progress":"Operation is not allowed");
      }
      return result(body.id,{create_time:Date.now(),transaction:row.attempt_id,state:1});
    }

    if(body.method==="PerformTransaction") {
      const transactionId=typeof params.id==="string"?params.id:"";
      const {data:attempt,error}=await db.from("monetization_payment_attempts")
        .select("id,order_id,status,provider_payment_id,provider_payload,amount_uzs,currency")
        .eq("provider","payme").eq("provider_payment_id",transactionId).maybeSingle();
      if(error) throw error;
      if(!attempt) return fail(body.id,-31003,"Transaction not found");
      const prior=paymePayload(attempt);
      if(attempt.status==="paid") return result(body.id,{transaction:attempt.id,perform_time:Number(prior.perform_time||Date.now()),state:2});
      if(attempt.status!=="processing") return fail(body.id,-31008,"Operation is not allowed");
      const performTime=Date.now();
      const {data:confirmed,error:confirmError}=await db.rpc("confirm_monetization_payment_attempt",{
        p_attempt_id:attempt.id,p_provider_payment_id:transactionId,
        p_provider_paydoc_id:null,p_paid_amount:Number(attempt.amount_uzs),
        p_currency:"UZS",p_provider_payload:{payme:{...prior,perform_time:performTime,state:2}},
      });
      if(confirmError || !confirmed?.paid) throw confirmError || new Error("PAYME_CONFIRMATION_FAILED");
      return result(body.id,{transaction:attempt.id,perform_time:performTime,state:2});
    }

    if(body.method==="CancelTransaction") {
      const transactionId=typeof params.id==="string"?params.id:"";
      const {data:attempt,error}=await db.from("monetization_payment_attempts")
        .select("id,status,provider_payload").eq("provider","payme").eq("provider_payment_id",transactionId).maybeSingle();
      if(error) throw error;
      if(!attempt) return fail(body.id,-31003,"Transaction not found");
      const prior=paymePayload(attempt);
      if(attempt.status==="cancelled"||attempt.status==="refunded") {
        return result(body.id,{transaction:attempt.id,cancel_time:Number(prior.cancel_time||Date.now()),state:stateOf(attempt)});
      }
      const cancelTime=Date.now();
      const {data:cancelled,error:cancelError}=await db.rpc("cancel_monetization_payment_attempt",{
        p_attempt_id:attempt.id,p_cancel_reason:Number(params.reason||0),
        p_cancel_payload:{payme:{...prior,cancel_reason:Number(params.reason||0),cancel_time:cancelTime,state:attempt.status==="paid"?-2:-1}},
      });
      if(cancelError) throw cancelError;
      return result(body.id,{transaction:attempt.id,cancel_time:cancelTime,state:Number(cancelled?.state||-1)});
    }

    if(body.method==="CheckTransaction") {
      const transactionId=typeof params.id==="string"?params.id:"";
      const {data:attempt,error}=await db.from("monetization_payment_attempts")
        .select("id,status,provider_payload,created_at").eq("provider","payme").eq("provider_payment_id",transactionId).maybeSingle();
      if(error) throw error;
      if(!attempt) return fail(body.id,-31003,"Transaction not found");
      const p=paymePayload(attempt);
      const cancel=objectValue(objectValue(attempt.provider_payload).cancel);
      const cancelPayme=objectValue(cancel.payme);
      return result(body.id,{
        create_time:Number(p.create_time||Date.parse(attempt.created_at)),
        perform_time:Number(p.perform_time||0),
        cancel_time:Number(cancelPayme.cancel_time||p.cancel_time||0),
        transaction:attempt.id,state:stateOf(attempt),
        reason:cancelPayme.cancel_reason??p.cancel_reason??null,
      });
    }

    if(body.method==="GetStatement") {
      const from=ms(params.from),to=ms(params.to);
      if(!from||!to||from>to) return fail(body.id,-32602,"Invalid params");
      const {data:attempts,error}=await db.from("monetization_payment_attempts")
        .select("id,provider_payment_id,status,provider_payload,amount_uzs,created_at")
        .eq("provider","payme").not("provider_payment_id","is",null).order("created_at",{ascending:true}).limit(10000);
      if(error) throw error;
      const transactions=(attempts||[]).map((a)=>{
        const p=paymePayload(a);
        const time=Number(p.time||p.create_time||Date.parse(a.created_at));
        const cancel=objectValue(objectValue(objectValue(a.provider_payload).cancel).payme);
        return {id:a.provider_payment_id,time,amount:Number(p.amount||Math.round(Number(a.amount_uzs)*100)),
          account:p.account||{},create_time:Number(p.create_time||Date.parse(a.created_at)),
          perform_time:Number(p.perform_time||0),cancel_time:Number(cancel.cancel_time||p.cancel_time||0),
          transaction:a.id,state:stateOf(a),reason:cancel.cancel_reason??p.cancel_reason??null};
      }).filter((t)=>t.id&&t.time>=from&&t.time<=to);
      return result(body.id,{transactions});
    }

    return fail(body.id,-32601,"Method not found",body.method);
  } catch(error) {
    console.error("[payme-callback] failed",{method:body.method,id:body.id,reason:error instanceof Error?error.message:"unknown"});
    return fail(body.id,-32400,"Internal merchant error");
  }
}
export async function GET() { return fail(null,-32300,"Request method must be POST"); }
