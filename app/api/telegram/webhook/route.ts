import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";
export const dynamic="force-dynamic";
type TelegramUpdate={update_id?:number;message?:{message_id?:number;date?:number;text?:string;chat?:{id?:number;type?:string};from?:{id?:number;first_name?:string;last_name?:string;username?:string};contact?:{phone_number?:string;first_name?:string;last_name?:string;user_id?:number}}};
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
async function sendMessage(token:string,chatId:number,text:string){await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text}),cache:"no-store"});}
export async function POST(request:Request){
 const env=getServerEnv();const token=env.TELEGRAM_BOT_TOKEN,secret=env.TELEGRAM_WEBHOOK_SECRET;
 if(!token||!secret)return NextResponse.json({error:"Telegram webhook sozlanmagan"},{status:503});
 const provided=request.headers.get("x-telegram-bot-api-secret-token")??"";
 if(!safeEqual(provided,secret))return NextResponse.json({error:"Ruxsat yo‘q"},{status:401});
 let update:TelegramUpdate;try{update=await request.json() as TelegramUpdate}catch{return NextResponse.json({error:"JSON noto‘g‘ri"},{status:400})}
 const m=update.message,chatId=m?.chat?.id,messageId=m?.message_id,from=m?.from;
 if(!m||!chatId||!messageId||!from?.id)return NextResponse.json({ok:true});
 const text=(m.text??"").trim().slice(0,4000);
 const contact=m.contact;
 const phone=contact?.phone_number??null;
 const name=[contact?.first_name??from.first_name,contact?.last_name??from.last_name].filter(Boolean).join(" ").slice(0,160)||null;
 const username=from.username??null;
 const db=createServiceRoleClient();
 const lead={source:"telegram",external_id:String(chatId)+":"+String(messageId),customer_name:name,phone,telegram_username:username,message:text|| (phone?"Telefon raqami yuborildi": "Telegram orqali murojaat"),metadata:{chat_id:String(chatId),telegram_user_id:String(from.id),update_id:update.update_id??null,message_date:m.date??null,contact_shared:Boolean(contact)}};
 const {error}=await db.from("crm_leads").upsert(lead,{onConflict:"source,external_id",ignoreDuplicates:true});
 if(error){console.error("[telegram-webhook] CRM insert failed",{code:error.code});return NextResponse.json({error:"Murojaat saqlanmadi"},{status:500});}
 if(text==="/start"||text.startsWith("/start ")){
  await sendMessage(token,chatId,"Assalomu alaykum! Cardrive’ga xush kelibsiz. Avtomobil bo‘yicha savolingizni yozing yoki telefon raqamingizni yuboring — menejerimiz siz bilan bog‘lanadi.");
 }else if(contact){
  await sendMessage(token,chatId,"Rahmat! Telefon raqamingiz qabul qilindi. Menejerimiz tez orada siz bilan bog‘lanadi.");
 }else if(text){
  await sendMessage(token,chatId,"Xabaringiz qabul qilindi. Cardrive menejeri siz bilan bog‘lanadi.");
 }
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
