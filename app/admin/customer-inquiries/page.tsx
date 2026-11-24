import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
import { UnifiedCrmInbox } from "@/components/unified-crm-inbox";
export const dynamic = "force-dynamic";
export default async function CustomerInquiriesPage({searchParams}:{searchParams:Promise<{source?:string;status?:string}>}) {
 const user=await requireAdminUser();
 const p=await searchParams;
 const db=createServiceRoleClient();
 let query=db.from("crm_leads").select("id,source,customer_name,phone,telegram_username,message,car_name,car_url,status,assigned_to,created_at,updated_at,metadata").order("created_at",{ascending:false}).limit(300);
 if(["jivo","telegram","new_car_advice"].includes(p.source??"")) query=query.eq("source",p.source!);
 if(["new","in_progress","contacted","resolved","spam"].includes(p.status??"")) query=query.eq("status",p.status!);
 const [leadsResult,staffResult]=await Promise.all([query,db.from("profiles").select("id,full_name,phone,role").in("role",["admin","manager"]).eq("is_active",true).order("full_name")]);
 if(leadsResult.error) throw new Error("CRM murojaatlarini yuklab bo‘lmadi");
 return <UnifiedCrmInbox leads={leadsResult.data??[]} staff={staffResult.data??[]} currentUserId={user.id} initialSource={p.source??"all"} initialStatus={p.status??"all"}/>;
}
