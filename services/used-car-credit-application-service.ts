import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type ApplicationRow = {
 id:string; listing_id:string; applicant_id:string; bank_id:string; financing_program_id:string;
 applicant_phone:string; pinfl:string; document_type:"passport"|"id_card"; document_series:string|null;
 document_number:string; document_front_path:string; document_back_path:string; car_price:number|string;
 car_currency:string; credit_currency:string; annual_interest_rate:number|string; down_payment_percent:number|string;
 term_months:number; estimated_monthly_payment:number|string; status:string; created_at:string;
 used_car_listings:{brand:string|null;model:string|null;year:number|null;slug:string|null}|null;
 banks:{name:string|null}|null; financing_programs:{name:string|null}|null;
 profiles:{full_name:string|null;phone:string|null}|null;
};
export type UsedCarCreditApplicationAdminRow = ApplicationRow & {frontUrl:string|null;backUrl:string|null};

export class UsedCarCreditApplicationService {
 async listAll():Promise<UsedCarCreditApplicationAdminRow[]>{
  const db=createServiceRoleClient();
  const result=await db.from("used_car_credit_applications").select("id,listing_id,applicant_id,bank_id,financing_program_id,applicant_phone,pinfl,document_type,document_series,document_number,document_front_path,document_back_path,car_price,car_currency,credit_currency,annual_interest_rate,down_payment_percent,term_months,estimated_monthly_payment,status,created_at,used_car_listings(brand,model,year,slug),banks(name),financing_programs(name),profiles!used_car_credit_applications_applicant_id_fkey(full_name,phone)").order("created_at",{ascending:false}).limit(200);
  if(result.error)throw new Error("Avtobozor kredit arizalarini yuklab bo‘lmadi.");
  const rows=(result.data??[]) as unknown as ApplicationRow[];
  return Promise.all(rows.map(async(row)=>{
   const front=row.document_front_path?await db.storage.from("used-car-credit-documents").createSignedUrl(row.document_front_path,300):null;
   const back=row.document_back_path?await db.storage.from("used-car-credit-documents").createSignedUrl(row.document_back_path,300):null;
   return {...row,frontUrl:front?.data?.signedUrl??null,backUrl:back?.data?.signedUrl??null};
  }));
 }
}
