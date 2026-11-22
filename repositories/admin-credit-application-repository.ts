import "server-only";
import {createServiceRoleClient} from "@/supabase/server";
type SingleOrArray<T>=T|T[]|null;const first=<T>(v:SingleOrArray<T>|undefined):T|null=>Array.isArray(v)?v[0]??null:v??null;
type Row={id:string;order_id:string;status:string;created_at:string;updated_at:string;submitted_at:string|null;oneid_consent_confirmed:boolean;personal_data_consent:boolean;personal_data_consent_at:string|null;applicant_phone:string|null;pinfl:string|null;passport_series:string|null;passport_number:string|null;passport_front_path:string|null;passport_back_path:string|null;banks?:SingleOrArray<{name:string;code:string}>;financing_programs?:SingleOrArray<{name:string}>;orders?:SingleOrArray<{order_number:string;customer_id:string;profiles?:SingleOrArray<{phone:string|null;full_name:string|null}>}>};
export type AdminCreditApplicationListItem={id:string;orderId:string;status:string;createdAt:string;updatedAt:string;submittedAt:string|null;oneidConsentConfirmed:boolean;personalDataConsent:boolean;personalDataConsentAt:string|null;applicantPhone:string|null;pinfl:string|null;passportSeries:string|null;passportNumber:string|null;passportFrontUrl:string|null;passportBackUrl:string|null;bank:{name:string;code:string}|null;financingProgram:{name:string}|null;order:{orderNumber:string;customer:{phone:string|null;full_name:string|null}|null}|null};
const normalize=(r:Row):AdminCreditApplicationListItem=>{const o=first(r.orders);return{id:r.id,orderId:r.order_id,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,submittedAt:r.submitted_at??null,oneidConsentConfirmed:r.oneid_consent_confirmed,personalDataConsent:r.personal_data_consent,personalDataConsentAt:r.personal_data_consent_at??null,applicantPhone:r.applicant_phone??null,pinfl:r.pinfl??null,passportSeries:r.passport_series??null,passportNumber:r.passport_number??null,passportFrontUrl:null,passportBackUrl:null,bank:first(r.banks),financingProgram:first(r.financing_programs),order:o?{orderNumber:o.order_number,customer:first(o.profiles)}:null};};
export class AdminCreditApplicationRepository{
 async listAll(options:{sort?:"newest"|"oldest"}={}){
  const client=createServiceRoleClient();
  const r=await client.from("credit_applications").select("id,order_id,status,created_at,updated_at,submitted_at,oneid_consent_confirmed,personal_data_consent,personal_data_consent_at,applicant_phone,pinfl,passport_series,passport_number,passport_front_path,passport_back_path,banks(name,code),financing_programs(name),orders!credit_applications_order_id_fkey(order_number,customer_id,profiles!orders_customer_id_fkey(phone,full_name))").order("created_at",{ascending:options.sort==="oldest"});
  if(!r.data)return{...r,data:null};
  const data=await Promise.all((r.data as unknown as Row[]).map(async row=>{
   const item=normalize(row);
   if(row.passport_front_path){const signed=await client.storage.from("credit-application-documents").createSignedUrl(row.passport_front_path,300);item.passportFrontUrl=signed.data?.signedUrl??null;}
   if(row.passport_back_path){const signed=await client.storage.from("credit-application-documents").createSignedUrl(row.passport_back_path,300);item.passportBackUrl=signed.data?.signedUrl??null;}
   return item;
  }));
  return{...r,data};
 }
 async audit(actorId:string,action:string,entityType:string,entityId:string){return createServiceRoleClient().from("audit_logs").insert({actor_id:actorId,action,entity_type:entityType,entity_id:entityId,metadata:{}});}
}
