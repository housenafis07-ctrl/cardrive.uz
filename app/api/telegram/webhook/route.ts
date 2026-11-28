import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getTelegramRuntimeConfig } from "@/lib/telegram-runtime";
import { createCrmClient, createServiceRoleClient, createTelegramAiListingClient } from "@/supabase/server";
import { normalizeUzbekPhone } from "@/schemas/common";
import { extractAvtobozorDraft } from "@/lib/openai-avtobozor";

export const dynamic = "force-dynamic";
const MINI_APP_URL = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://cardrive.uz";
type TelegramPhoto = { file_id: string; file_unique_id?: string; width: number; height: number; file_size?: number };
type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number; date?: number; text?: string; caption?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string };
    contact?: { phone_number?: string; first_name?: string; last_name?: string; user_id?: number };
    photo?: TelegramPhoto[];
    media_group_id?: string;
    forward_origin?: unknown;
    forward_from?: { id?: number; first_name?: string; last_name?: string; username?: string };
    forward_date?: number;
  };
};
function safeEqual(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
const keyboard = { keyboard: [[{ text: "🚗 Cardrive Mini App", web_app: { url: MINI_APP_URL } }], [{ text: "📞 Telefon raqamimni yuborish", request_contact: true }], [{ text: "🚘 Avtomobil sotish" }]], resize_keyboard: true, is_persistent: true };
const welcome = `Assalomu alaykum, {name}! 👋
Cardrive’ga xush kelibsiz!

🚘 Cardrive — yangi va ishlatilgan avtomobillarni topish, taqqoslash hamda xarid uchun moliyalashtirish imkoniyatlari bilan tanishish platformasi.

📱 Qanday foydalaniladi?
1. “🚗 Cardrive Mini App” tugmasini bosing.
2. Yangi avtomobillar yoki Avtobozor bo‘limini tanlang.
3. Marka, model, narx va boshqa mezonlar bo‘yicha qidiring.
4. Avtomobil sahifasida rasmlar, tavsif va mavjud moliyalashtirish shartlarini ko‘ring.
5. Savolingiz bo‘lsa, shu botga xabar yozing yoki telefon raqamingizni yuboring — menejerimiz siz bilan bog‘lanadi.
6. Avtomobilingizni sotmoqchi bo‘lsangiz, “🚘 Avtomobil sotish” tugmasini bosing.

💬 Murojaatingiz shu yerning o‘zida qabul qilinadi.
👇 Ilovani ochish, telefon raqamingizni yuborish yoki avtomobil sotish uchun quyidagi tugmalardan foydalaning.`;
const help = `Cardrive’dan foydalanish:
🚗 Mini App — avtomobillar katalogi va Avtobozorni ochadi.
🔎 Qidiruv va filtrlar — kerakli avtomobilni topishga yordam beradi.
📄 Avtomobil sahifasi — narx, tavsif va moliyalashtirish ma’lumotlarini ko‘rsatadi.
💬 Murojaat — shu chatga savolingizni yozing.
📞 Telefon — “Telefon raqamimni yuborish” tugmasini bosing, menejer sizga aloqaga chiqadi.
🚘 Avtomobil sotish — “Avtomobil sotish” tugmasini bosing yoki /sell buyrug‘ini yuboring.

Ilovani ochish uchun “🚗 Cardrive Mini App” tugmasini bosing.`;
async function sendMessage(token: string, chatId: number, text: string, withKeyboard = true) {
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: withKeyboard ? keyboard : undefined }),
    cache: "no-store",
  });
  if (!response.ok) console.error("[telegram-webhook] sendMessage failed", { status: response.status });
}
function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }
async function getOrCreateDraft(db: ReturnType<typeof createTelegramAiListingClient>, args: {
  telegramUserId: string; chatId: string; source: "forwarded_post" | "separate_photos";
}) {
  const existing = await db.from("telegram_ai_listing_drafts").select("*")
    .eq("telegram_user_id", args.telegramUserId).eq("telegram_chat_id", args.chatId)
    .eq("status", "collecting").gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) throw new Error("DRAFT_STORAGE_UNAVAILABLE");
  if (existing.data) return existing.data;
  const insert = await db.from("telegram_ai_listing_drafts").insert({
    telegram_user_id: args.telegramUserId, telegram_chat_id: args.chatId,
    source: args.source, status: "collecting", source_text: "",
    handoff_token_hash: hashToken(randomBytes(32).toString("hex")),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  }).select("*").single();
  if (insert.error || !insert.data) throw new Error("DRAFT_STORAGE_UNAVAILABLE");
  return insert.data;
}
async function downloadTelegramPhoto(token: string, fileId: string) {
  const metaResponse = await fetch("https://api.telegram.org/bot" + token + "/getFile?file_id=" + encodeURIComponent(fileId), { cache: "no-store" });
  if (!metaResponse.ok) throw new Error("TELEGRAM_FILE_LOOKUP_FAILED");
  const meta = await metaResponse.json() as { ok?: boolean; result?: { file_path?: string } };
  const path = meta.result?.file_path;
  if (!meta.ok || !path || path.includes("..")) throw new Error("TELEGRAM_FILE_LOOKUP_FAILED");
  const imageResponse = await fetch("https://api.telegram.org/file/bot" + token + "/" + path, { cache: "no-store" });
  if (!imageResponse.ok) throw new Error("TELEGRAM_FILE_DOWNLOAD_FAILED");
  const contentType = imageResponse.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw new Error("UNSUPPORTED_TELEGRAM_IMAGE");
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("TELEGRAM_IMAGE_SIZE_INVALID");
  return "data:" + contentType + ";base64," + bytes.toString("base64");
}
async function analyzeDraft(token: string, chatId: number, telegramUserId: string, draft: { id: string; source_text: string | null }) {
  const db = createTelegramAiListingClient();
  const photoRows = await db.from("telegram_ai_listing_draft_photos").select("telegram_file_id,sort_order").eq("draft_id", draft.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }).limit(8);
  if (photoRows.error) throw new Error("DRAFT_PHOTOS_UNAVAILABLE");
  const fileIds = (photoRows.data ?? []).map((row: { telegram_file_id: string }) => row.telegram_file_id).slice(0, 8);
  if (!draft.source_text?.trim() && !fileIds.length) {
    await sendMessage(token, chatId, "Tahlil qilish uchun e’lon matni yoki kamida bitta avtomobil rasmini yuboring.");
    return;
  }
  await db.from("telegram_ai_listing_drafts").update({ status: "analyzing", updated_at: new Date().toISOString() }).eq("id", draft.id);
  try {
    const images = await Promise.all(fileIds.map((id: string) => downloadTelegramPhoto(token, id)));
    const result = await extractAvtobozorDraft({ text: String(draft.source_text ?? "").slice(0, 12000), imageDataUrls: images });
    if (!result.is_vehicle_listing) {
      await db.from("telegram_ai_listing_drafts").update({ status: "collecting", updated_at: new Date().toISOString() }).eq("id", draft.id);
      await sendMessage(token, chatId, "Bu materialdan avtomobil sotish e’loni ekanini aniqlay olmadim. Iltimos, avtomobil e’lonini yuboring.");
      return;
    }
    const missing = [
      ["brand", result.brand], ["model", result.model], ["year", result.year],
      ["mileage_km", result.mileage_km], ["price", result.price], ["currency", result.currency],
      ["country_of_origin", result.country_of_origin && result.country_of_origin !== "unknown" ? result.country_of_origin : null],
      ["region", result.region], ["vehicle_condition", result.vehicle_condition],
      ["condition_description", result.condition_description?.length >= 10 ? result.condition_description : null],
      ["description", result.description?.length >= 20 ? result.description : null],
      ["contact_name", result.contact_name],
    ].filter(([, value]) => value === null || value === undefined || value === "").map(([key]) => key);
    const rawToken = randomBytes(32).toString("hex");
    const updated = await db.from("telegram_ai_listing_drafts").update({
      status: "review", ai_payload: result, missing_fields: missing,
      handoff_token_hash: hashToken(rawToken), updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    }).eq("id", draft.id).eq("telegram_user_id", telegramUserId).select("id").single();
    if (updated.error) throw new Error("DRAFT_SAVE_FAILED");
    const next = "/avtobozor/ai-draft?token=" + encodeURIComponent(rawToken);
    const previewHost = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://cardrive.uz";
    const loginUrl = previewHost + "/account/login?next=" + encodeURIComponent(next);
    await sendMessage(token, chatId,
      "✅ AI tahlili tayyor.\n\n" +
      "🚘 " + [result.brand, result.model, result.year].filter(Boolean).join(" ") + "\n" +
      "💰 " + (result.price ? new Intl.NumberFormat("uz-UZ").format(result.price) + " " + (result.currency ?? "") : "Narx aniqlanmadi") + "\n" +
      "📷 Rasmlar: " + fileIds.length + " ta. Asosiy rasm indeksi: " + (result.primary_image_index ?? "tanlanmadi") + "\n" +
      "🟠 To‘ldirish yoki tekshirish kerak: " + missing.length + " ta maydon.\n\n" +
      "Davom etish uchun Cardrive’ga kirib, SMS kod bilan telefon raqamingizni tasdiqlang:\n" + loginUrl);
  } catch (error) {
    await db.from("telegram_ai_listing_drafts").update({ status: "collecting", updated_at: new Date().toISOString() }).eq("id", draft.id);
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("[telegram-ai-listing] analysis failed", { code });
    await sendMessage(token, chatId, code === "OPENAI_API_KEY_NOT_CONFIGURED"
      ? "AI xizmati hali sozlanmagan. Iltimos, keyinroq urinib ko‘ring."
      : "E’lonni tahlil qilishda xatolik yuz berdi. Rasmlarni yoki matnni qayta yuborib, /analyze buyrug‘ini bosing.");
  }
}
export async function POST(request: Request) {
  const { token, secret } = getTelegramRuntimeConfig();
  if (!token || !secret) return NextResponse.json({ error: "Telegram webhook sozlanmagan" }, { status: 503 });
  const provided = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeEqual(provided, secret)) return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 401 });
  let update: TelegramUpdate;
  try { update = await request.json() as TelegramUpdate; } catch { return NextResponse.json({ error: "JSON noto‘g‘ri" }, { status: 400 }); }
  const m = update.message, chatId = m?.chat?.id, messageId = m?.message_id, from = m?.from;
  if (!m || !chatId || !messageId || !from?.id) return NextResponse.json({ ok: true });
  const text = (m.text ?? "").trim().slice(0, 4000), caption = (m.caption ?? "").trim().slice(0, 4000), contact = m.contact;
  const isSell = text === "🚘 Avtomobil sotish" || /^\/sell(?:@\w+)?(?:\s|$)/i.test(text);
  const isAnalyze = /^\/(analyze|tahlil)(?:@\w+)?(?:\s|$)/i.test(text) || text === "🔍 E’lonni tahlil qilish";
  const isCommand = /^\/(start|help|app|sell|analyze|tahlil)(?:@\w+)?(?:\s|$)/i.test(text);
  const forward = Boolean(m.forward_origin || m.forward_from);
  const hasPhoto = Boolean(m.photo?.length);
  if (text === "/start" || /^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
    const firstName = (from.first_name ?? "").trim() || "do‘stimiz";
    await sendMessage(token, chatId, welcome.replace("{name}", firstName));
  } else if (/^\/help(?:@\w+)?(?:\s|$)/i.test(text)) {
    await sendMessage(token, chatId, help);
  } else if (/^\/app(?:@\w+)?(?:\s|$)/i.test(text) || text === "🚗 Cardrive Mini App") {
    await sendMessage(token, chatId, "Cardrive ilovasini ochish uchun quyidagi tugmani bosing. 🚗");
  } else if (isSell) {
    try {
      const db = createTelegramAiListingClient();
      await getOrCreateDraft(db, { telegramUserId: String(from.id), chatId: String(chatId), source: "separate_photos" });
      await sendMessage(token, chatId, "🚘 E’lon tayyorlash boshlandi.\n\nTayyor Telegram e’lonini forward qiling yoki 1–8 ta rasmni matn bilan yuboring. Barcha materiallarni yuborganingizdan keyin /analyze buyrug‘ini bosing.\n\nAI ma’lumotlarni tekshiradi; e’lon siz tasdiqlamaguningizcha joylanmaydi.");
    } catch (error) {
      console.error("[telegram-ai-listing] draft start failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
      await sendMessage(token, chatId, "AI e’lon Draft tizimi hozircha tayyor emas. Texnik sozlash tugagach qayta urinib ko‘ring.");
    }
  } else if (isAnalyze) {
    try {
      const db = createTelegramAiListingClient();
      const { data, error } = await db.from("telegram_ai_listing_drafts").select("*")
        .eq("telegram_user_id", String(from.id)).eq("telegram_chat_id", String(chatId))
        .eq("status", "collecting").gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error || !data) throw new Error("ACTIVE_DRAFT_NOT_FOUND");
      await analyzeDraft(token, chatId, String(from.id), data);
    } catch (error) {
      console.error("[telegram-ai-listing] analyze command failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
      await sendMessage(token, chatId, "Faol Draft topilmadi. Avval “🚘 Avtomobil sotish” tugmasini bosing.");
    }
  } else if (contact) {
    const crm = createCrmClient();
    const name = [contact.first_name ?? from.first_name, contact.last_name ?? from.last_name].filter(Boolean).join(" ").slice(0, 160) || null;
    const { error } = await crm.from("crm_leads").upsert({ source: "telegram", external_id: String(chatId) + ":" + String(messageId), customer_name: name, phone: contact.phone_number ?? null, telegram_username: from.username ?? null, message: "Mijoz telefon raqamini yubordi.", metadata: { chat_id: String(chatId), telegram_user_id: String(from.id), update_id: update.update_id ?? null, message_date: m.date ?? null, contact_shared: true } }, { onConflict: "source,external_id", ignoreDuplicates: true });
    if (error) { console.error("[telegram-webhook] contact save failed", { code: error.code }); await sendMessage(token, chatId, "Telefon raqamingizni saqlashda xatolik yuz berdi. Iltimos, birozdan keyin qayta urinib ko‘ring."); return NextResponse.json({ ok: true }); }
    if (contact.user_id !== from.id) {
      await sendMessage(token, chatId, "Telefon raqamingiz murojaat uchun qabul qilindi. Akkauntga bog‘lash uchun Telegram’dagi o‘zingizning kontakt kartangizni yuboring.");
    } else {
      const phone = normalizeUzbekPhone(contact.phone_number ?? "");
      if (!/^\\+998\\d{9}$/.test(phone)) {
        await sendMessage(token, chatId, "Telefon raqami formati noto‘g‘ri. Iltimos, +998 formatidagi o‘z raqamingizni yuboring.");
      } else {
        const profiles = createServiceRoleClient();
        const profile = await profiles.from("profiles").select("id,is_active").eq("phone", phone).maybeSingle();
        if (profile.error || !profile.data || profile.data.is_active === false) {
          await sendMessage(token, chatId, "Telefon raqamingiz murojaat uchun qabul qilindi. Kabinetga bog‘lash uchun SMS OTP orqali kirishingiz kerak bo‘ladi.");
        } else {
          const links = createTelegramAiListingClient();
          const currentLink = await links.from("telegram_user_links").select("profile_id").eq("telegram_user_id", String(from.id)).maybeSingle();
          if (currentLink.error || (currentLink.data && currentLink.data.profile_id !== profile.data.id)) {
            await sendMessage(token, chatId, "Bu Telegram akkaunti boshqa Cardrive profiliga bog‘langan. Yordam uchun menejerga murojaat qiling.");
          } else {
            const linked = await links.from("telegram_user_links").upsert({
              telegram_user_id: String(from.id), profile_id: profile.data.id, phone,
            }, { onConflict: "telegram_user_id" });
            if (linked.error) {
              console.error("[telegram-webhook] account link failed", { code: linked.error.code });
              await sendMessage(token, chatId, "Telefon qabul qilindi, lekin akkauntni bog‘lashda xatolik yuz berdi. SMS OTP orqali kiring.");
            } else {
              await links.from("telegram_ai_listing_drafts").update({
                claimed_profile_id: profile.data.id, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              }).eq("telegram_user_id", String(from.id)).eq("telegram_chat_id", String(chatId)).eq("status", "review").is("claimed_profile_id", null);
              await sendMessage(token, chatId, "✅ Telegram akkauntingiz mavjud Cardrive profilingizga bog‘landi. SMS OTP orqali saytga kirganingizdan keyin Draft’ni davom ettirishingiz mumkin.");
            }
          }
        }
      }
    }
  } else if (hasPhoto || forward) {
    try {
      const db = createTelegramAiListingClient();
      const draft = await getOrCreateDraft(db, { telegramUserId: String(from.id), chatId: String(chatId), source: forward ? "forwarded_post" : "separate_photos" });
      const incoming = (m.photo ?? []).slice(-1);
      if (incoming.length) {
        const photo = incoming[0];
        const existing = await db.from("telegram_ai_listing_draft_photos")
          .select("id").eq("draft_id", draft.id);
        if (existing.error) throw new Error("DRAFT_PHOTOS_UNAVAILABLE");
        const alreadyStored = existing.data?.length ?? 0;
        if (alreadyStored < 8) {
          const savedPhoto = await db.from("telegram_ai_listing_draft_photos").upsert({
            draft_id: draft.id,
            telegram_file_id: photo.file_id,
            telegram_file_unique_id: photo.file_unique_id ?? photo.file_id,
            sort_order: messageId,
          }, { onConflict: "draft_id,telegram_file_unique_id", ignoreDuplicates: true });
          if (savedPhoto.error) throw new Error("DRAFT_PHOTO_SAVE_FAILED");
        }
      }
      const sourceText = [String(draft.source_text ?? ""), text, caption].filter(Boolean).join("\n").slice(0, 12000);
      const result = await db.from("telegram_ai_listing_drafts").update({
        source: forward ? "forwarded_post" : draft.source,
        source_text: sourceText,
        updated_at: new Date().toISOString(),
      }).eq("id", draft.id).eq("telegram_user_id", String(from.id));
      if (result.error) throw new Error("DRAFT_UPDATE_FAILED");
      await sendMessage(token, chatId, "📥 Qabul qilindi. Matn va rasmlar yig‘ilmoqda. Barchasini yuborganingizdan keyin /analyze buyrug‘ini bosing.");
    } catch (error) {
      console.error("[telegram-ai-listing] media intake failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
      await sendMessage(token, chatId, "Materialni Draft’ga saqlab bo‘lmadi. Keyinroq qayta urinib ko‘ring.");
    }
  } else if (text && !isCommand) {
    let handledAsDraft = false;
    try {
      const db = createTelegramAiListingClient();
      const { data } = await db.from("telegram_ai_listing_drafts").select("*")
        .eq("telegram_user_id", String(from.id)).eq("telegram_chat_id", String(chatId))
        .eq("status", "collecting").gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        const merged = [String(data.source_text ?? ""), text].filter(Boolean).join("\n").slice(0, 12000);
        const saved = await db.from("telegram_ai_listing_drafts").update({ source_text: merged, updated_at: new Date().toISOString() }).eq("id", data.id);
        if (saved.error) throw new Error("DRAFT_UPDATE_FAILED");
        await sendMessage(token, chatId, "📝 E’lon matni Draft’ga qo‘shildi. Barcha ma’lumotlarni yuborgach /analyze buyrug‘ini bosing.");
        handledAsDraft = true;
      }
    } catch (error) {
      console.error("[telegram-ai-listing] text intake failed", { code: error instanceof Error ? error.message : "UNKNOWN" });
    }
    if (!handledAsDraft) {
      const db = createCrmClient();
      const name = [from.first_name, from.last_name].filter(Boolean).join(" ").slice(0, 160) || null;
      const { error } = await db.from("crm_leads").upsert({ source: "telegram", external_id: String(chatId) + ":" + String(messageId), customer_name: name, telegram_username: from.username ?? null, message: text, metadata: { chat_id: String(chatId), telegram_user_id: String(from.id), update_id: update.update_id ?? null, message_date: m.date ?? null } }, { onConflict: "source,external_id", ignoreDuplicates: true });
      if (error) { console.error("[telegram-webhook] CRM insert failed", { code: error.code }); await sendMessage(token, chatId, "Xabaringizni saqlashda xatolik yuz berdi. Iltimos, qayta yuboring."); return NextResponse.json({ ok: true }); }
      await sendMessage(token, chatId, "Xabaringiz qabul qilindi. ✅ Cardrive menejeri siz bilan bog‘lanadi. Qo‘shimcha ma’lumot uchun telefon raqamingizni ham yuborishingiz mumkin.");
    }
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
