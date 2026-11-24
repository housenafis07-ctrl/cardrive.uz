"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
export async function updateMonetizationProductAction(form: FormData) {
  await requireAdminUser();
  const id=String(form.get("id")??"").trim();
  const raw=String(form.get("amount")??"").trim();
  const amount=raw===""?null:Number(raw);
  const currency=String(form.get("currency")??"UZS");
  const d=String(form.get("duration_days")??"").trim();
  const duration=d===""?null:Number(d);
  const isActive=form.get("is_active")==="on";
  if(!id||(amount!==null&&(!Number.isFinite(amount)||amount<0))||!["UZS","USD"].includes(currency)||(duration!==null&&(!Number.isInteger(duration)||duration<1||duration>3650))||(isActive&&(amount===null||amount<=0))) redirect("/admin/monetization?error=Narx+yoki+parametrlarni+tekshiring");
  const db=createServiceRoleClient();
  const {error}=await db.from("monetization_products").update({amount,currency,duration_days:duration,is_active:isActive,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) redirect("/admin/monetization?error=Mahsulotni+saqlab+bo'lmadi");
  revalidatePath("/admin/monetization"); revalidatePath("/account/monetization");
  redirect("/admin/monetization?saved=1");
}