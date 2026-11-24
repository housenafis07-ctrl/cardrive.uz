"use client";

import { useState } from "react";
import Link from "next/link";

export function UsedCarInquiryForm({ listingId, isAuthenticated, locale = "uz" }: { listingId: string; isAuthenticated: boolean; locale?: "uz" | "ru" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const ru = locale === "ru";
  if (!isAuthenticated) return <Link href={"/account/login?next=" + encodeURIComponent(typeof window === "undefined" ? "/avtobozor" : window.location.pathname)} className="mt-3 block rounded-full border border-blue-200 px-4 py-3 text-center text-sm font-bold text-blue-700">{ru ? "Войдите, чтобы написать продавцу" : "Sotuvchiga yozish uchun tizimga kiring"}</Link>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/avtobozor/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message }), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (ru ? "Не удалось отправить" : "Yuborib bo‘lmadi"));
      setMessage("");
      setNotice(ru ? "Сообщение отправлено. Продолжить переписку можно в разделе «Мои обращения»." : "Murojaat yuborildi. Suhbatni «Murojaatlarim» bo‘limida davom ettirasiz.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : (ru ? "Ошибка запроса" : "So‘rovda xatolik"));
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-4 space-y-2">
    <label htmlFor="used-car-inquiry" className="block text-sm font-bold">{ru ? "Написать продавцу" : "Sotuvchiga murojaat"}</label>
    <textarea id="used-car-inquiry" value={message} onChange={event => setMessage(event.target.value)} minLength={3} maxLength={1000} required rows={3} placeholder={ru ? "Здравствуйте, автомобиль ещё доступен?" : "Assalomu alaykum, avtomobil hali sotuvdami?"} className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-500" />
    <button disabled={busy || message.trim().length < 3} className="w-full rounded-full bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? (ru ? "Отправка..." : "Yuborilmoqda...") : (ru ? "Отправить сообщение" : "Xabar yuborish")}</button>
    {notice ? <p role="status" className="text-xs text-slate-600">{notice}</p> : null}
    <Link href="/account/inquiries" className="block text-center text-xs font-semibold text-blue-700 hover:underline">{ru ? "Мои обращения" : "Murojaatlarim"}</Link>
  </form>;
}
