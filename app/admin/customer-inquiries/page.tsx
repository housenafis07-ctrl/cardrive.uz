import { requireAdminUser } from "@/lib/admin-auth";
import { createCrmClient } from "@/supabase/server";
import { UnifiedCrmInbox } from "@/components/unified-crm-inbox";
export const dynamic = "force-dynamic";
export default async function CustomerInquiriesPage({searchParams}:{searchParams:Promise<{source?:string;status?:string}>}) {
 const user=await requireAdminUser();
 const p=await searchParams;
 const db=createServiceRoleClient();
 let query=db.from("crm_leads").select("id,source,customer_name,phone,telegram_username,message,car_name,car_url,status,assigned_to,created_at,updated_at,metadata").order("created_at",{ascending:false}).limit(300);
 if(["jivo","telegram","new_car_advice","website_chat"].includes(p.source??"")) query=query.eq("source",p.source!);
 if(["new","in_progress","contacted","resolved","spam"].includes(p.status??"")) query=query.eq("status",p.status!);
 const [leadsResult,staffResult]=await Promise.all([query,db.from("profiles").select("id,full_name,phone,role").in("role",["admin","manager"]).eq("is_active",true).order("full_name")]);
 if(leadsResult.error){
  console.error("[admin/customer-inquiries] CRM query failed",{code:leadsResult.error.code,message:leadsResult.error.message});
  const schemaMissing=leadsResult.error.code==="42P01"||leadsResult.error.code==="PGRST205";
  return <main className="mx-auto max-w-3xl p-6 sm:p-10"><div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8"><p className="text-xs font-black tracking-[.18em] text-amber-800">CARDRIVE · CRM</p><h1 className="mt-2 text-2xl font-black text-slate-950">Mijozlar murojaatlari</h1><p className="mt-4 text-sm leading-6 text-slate-700">{schemaMissing?"CRM ma’lumotlar bazasi hali sozlanmagan. Ushbu bo‘lim ishlashi uchun loyiha migratsiyasidagi crm_leads jadvalini Supabase’ga qo‘llash kerak.":"CRM murojaatlarini yuklashda vaqtinchalik xatolik yuz berdi."}</p><p className="mt-3 text-xs text-slate-500">Xatolik kodi: {leadsResult.error.code||"noma’lum"}. Ma’lumotlar o‘zgartirilmagan.</p><a href="/admin/customer-inquiries" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Qayta urinish</a></div></main>;
 }
 return <UnifiedCrmInbox leads={leadsResult.data??[]} staff={staffResult.data??[]} currentUserId={user.id} initialSource={p.source??"all"} initialStatus={p.status??"all"}/>;
}
