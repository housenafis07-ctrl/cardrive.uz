"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

const value = (d: FormData, k: string) => { const v = d.get(k); return typeof v === "string" && v.trim() ? v.trim() : null; };
const num = (d: FormData, k: string) => { const v = value(d, k); if (v === null) return null; const n = Number(v.replace(",", ".")); return Number.isFinite(n) ? n : null; };
const selected = (d: FormData, k: string) => d.getAll(k).filter((v): v is string => typeof v === "string" && v.length > 0);

export async function createBankAction(d: FormData) {
  const user = await requireAdminUser(); const name = value(d,"name"); const code = value(d,"code");
  if (!name || !code) redirect("/admin/banks?error=Bank+nomi+va+kodi+majburiy");
  const c = createServiceRoleClient();
  const r = await c.from("banks").insert({ name, name_ru:value(d,"nameRu"), code, logo_url:value(d,"logoUrl"), website_url:value(d,"websiteUrl"), phone:value(d,"phone"), description:value(d,"description"), is_active:d.get("isActive")==="on", integration_status:value(d,"integrationStatus")??"information_only" }).select("id").single();
  if(r.error) redirect(`/admin/banks?error=${encodeURIComponent(r.error.message)}`);
  await c.from("audit_logs").insert({actor_id:user.id,action:"bank.created",entity_type:"bank",entity_id:r.data.id,metadata:{}});
  revalidatePath("/admin/banks"); revalidatePath("/admin/financing-programs"); redirect("/admin/banks?success=created");
}

export async function createFinancingProgramAction(d: FormData) {
  const user=await requireAdminUser(); const type=value(d,"financingType"); const name=value(d,"name"); const bankId=value(d,"bankId");
  if(!name||!["credit","installment"].includes(type??"")) redirect("/admin/financing-programs?error=Nom+va+turi+majburiy");
  if(type==="credit"&&!bankId) redirect("/admin/financing-programs?error=Bank+kredit+uchun+majburiy");
  const c=createServiceRoleClient();
  const r=await c.from("financing_programs").insert({
    bank_id:bankId,name,name_uz:value(d,"nameUz")??name,name_ru:value(d,"nameRu"),type,
    interest_rate:num(d,"annualInterestRate")??0,down_payment_percent:num(d,"minDownPaymentPercent")??0,
    term_months:num(d,"maxTermMonths")??num(d,"minTermMonths")??12,commission_percent:num(d,"commissionPercent")??0,
    min_car_price:num(d,"minCarPrice"),max_car_price:num(d,"maxCarPrice"),min_amount:num(d,"minAmount"),max_amount:num(d,"maxAmount"),max_financing_percent:num(d,"maxFinancingPercent"),
    insurance_type:value(d,"insuranceType"),insurance_amount:num(d,"insuranceAmount"),insurance_percent:num(d,"insurancePercent"),benefits_uz:value(d,"benefitsUz"),benefits_ru:value(d,"benefitsRu"),
    description:value(d,"description"),eligibility_notes:value(d,"eligibilityNotes"),currency:value(d,"currency")??"UZS",is_active:d.get("isActive")==="on",sort_order:num(d,"displayOrder")??0,
    source_url:value(d,"sourceUrl"),source_label:value(d,"sourceLabel"),last_verified_at:new Date().toISOString(),
  }).select("id").single();
  if(r.error) redirect(`/admin/financing-programs?error=${encodeURIComponent(r.error.message)}`);
  const dealerIds=selected(d,"dealerIds"); if(dealerIds.length){const links=await c.from("financing_program_dealers").insert(dealerIds.map(dealer_id=>({dealer_id,financing_program_id:r.data.id})));if(links.error)redirect(`/admin/financing-programs?error=${encodeURIComponent(links.error.message)}`);}
  const carIds=selected(d,"carIds"); if(carIds.length){const links=await c.from("financing_program_cars").insert(carIds.map(car_id=>({car_id,financing_program_id:r.data.id})));if(links.error)redirect(`/admin/financing-programs?error=${encodeURIComponent(links.error.message)}`);}
  await c.from("audit_logs").insert({actor_id:user.id,action:"financing_program.created",entity_type:"financing_program",entity_id:r.data.id,metadata:{type,bankId}});
  revalidatePath("/admin/financing-programs"); revalidatePath("/"); revalidatePath("/cars"); redirect("/admin/financing-programs?success=created");
}
