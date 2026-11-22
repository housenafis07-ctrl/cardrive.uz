"use server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
const allowed=new Set(["pending","under_review","sent_to_bank","approved","rejected","cancelled"]);
export async function updateUsedCarCreditStatus(formData:FormData):Promise<{ok:boolean;message?:string}>{
 const user=await requireAdminUser();
 if(user.role!=="admin"&&user.role!=="manager")return{ok:false,message:"Ruxsat yo‘q."};
 const id=formData.get("applicationId"),status=formData.get("status");
 if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id)||typeof status!=="string"||!allowed.has(status))return{ok:false,message:"So‘rov noto‘g‘ri."};
 const db=createServiceRoleClient();
 const result=await db.from("used_car_credit_applications").update({status,updated_at:new Date().toISOString()}).eq("id",id).select("id").maybeSingle();
 if(result.error||!result.data)return{ok:false,message:"Ariza holatini yangilab bo‘lmadi."};
 await db.from("audit_logs").insert({actor_id:user.id,action:"used_car_credit_application.status_updated",entity_type:"used_car_credit_application",entity_id:id,metadata:{status}});
 revalidatePath("/admin/used-car-credit-applications");
 return{ok:true};
}
