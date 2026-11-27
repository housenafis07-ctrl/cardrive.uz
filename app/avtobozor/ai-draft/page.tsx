import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createTelegramAiListingClient } from "@/supabase/server";
import { TelegramAiDraftForm } from "@/components/telegram-ai-draft-form";

export const dynamic = "force-dynamic";
export default async function TelegramAiDraftPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (!/^[a-f0-9]{64}$/.test(token)) return <main className="mx-auto max-w-2xl p-8">Draft havolasi yaroqsiz yoki muddati tugagan.</main>;
  const customer = await getCurrentCustomer();
  const next = "/avtobozor/ai-draft?token=" + encodeURIComponent(token);
  if (!customer) redirect("/account/login?next=" + encodeURIComponent(next));
  const db = createTelegramAiListingClient();
  const hash = createHash("sha256").update(token).digest("hex");
  const found = await db.from("telegram_ai_listing_drafts").select("id,status,ai_payload,missing_fields,photo_file_ids,claimed_profile_id,expires_at")
    .eq("handoff_token_hash", hash).eq("status", "review").maybeSingle();
  if (found.error || !found.data || new Date(found.data.expires_at).getTime() < Date.now()) {
    return <main className="mx-auto max-w-2xl p-8"><h1 className="text-2xl font-black">Draft topilmadi</h1><p className="mt-2 text-slate-600">Havola eskirgan yoki e’lon allaqachon yuborilgan. Bot orqali yangi Draft yarating.</p><Link className="mt-4 inline-block text-blue-700 underline" href="/avtobozor">Avtobozorga qaytish</Link></main>;
  }
  if (found.data.claimed_profile_id && found.data.claimed_profile_id !== customer.id) {
    return <main className="mx-auto max-w-2xl p-8"><h1 className="text-2xl font-black">Bu Draft boshqa akkauntga bog‘langan</h1><p className="mt-2 text-slate-600">Telegram’da e’lonni yuborgan akkaunt egasi bilan bog‘laning.</p></main>;
  }
  if (!found.data.claimed_profile_id) {
    const claim = await db.from("telegram_ai_listing_drafts").update({ claimed_profile_id: customer.id, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", found.data.id).is("claimed_profile_id", null).eq("status", "review");
    if (claim.error) return <main className="mx-auto max-w-2xl p-8">Draft’ni akkauntga bog‘lab bo‘lmadi. Qayta urinib ko‘ring.</main>;
  }
  return <main className="mx-auto max-w-3xl px-4 py-8">
    <Link href="/avtobozor" className="text-sm font-semibold text-blue-700">← Avtobozor</Link>
    <h1 className="mt-3 text-3xl font-black">AI tayyorlagan avtomobil e’loni</h1>
    <p className="mt-2 text-slate-600">Telefon raqamingiz SMS OTP orqali tasdiqlandi. Ma’lumotlarni tekshiring va qizil maydonlarni to‘ldiring.</p>
    <TelegramAiDraftForm draft={{ id: found.data.id, ai_payload: found.data.ai_payload ?? {}, missing_fields: found.data.missing_fields ?? [], photo_count: Array.isArray(found.data.photo_file_ids) ? found.data.photo_file_ids.length : 0, plate_regions: Array.isArray(found.data.ai_payload?.plate_regions) ? found.data.ai_payload.plate_regions : [] }} />
  </main>;
}
