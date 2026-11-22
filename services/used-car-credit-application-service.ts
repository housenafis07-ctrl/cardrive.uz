import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
export class UsedCarCreditApplicationService {
 async listAll(){
  const db=createServiceRoleClient();
  const result=await db.from("used_car_credit_applications").select("id,listing_id,applicant_id,bank_id,financing_program_id,applicant_phone,pinfl,document_type,document_series,document_number,document_front_path,document_back_path,car_price,car_currency,annual_interest_rate,down_payment_percent,term_months,estimated_monthly_payment,status,created_at,used_car_listings(brand,model,year,slug),banks(name),financing_programs(name),profiles!used_car_credit_applications_applicant_id_fkey(full_name,phone)").order("created_at",{ascending:false}).limit(200);
  if(result.error)throw new Error("Avtobozor kredit arizalarini yuklab bo‘lmadi.");
  return Promise.all((result.data??[]).map(async(row:any)=>{
   const front=row.document_front_path?await db.storage.from("used-car-credit-documents").createSignedUrl(row.document_front_path,300):null;
   const back=row.document_back_path?await db.storage.from("used-car-credit-documents").createSignedUrl(row.document_back_path,300):null;
   return {...row,frontUrl:front?.data?.signedUrl??null,backUrl:back?.data?.signedUrl??null};
  }));
 }
}
