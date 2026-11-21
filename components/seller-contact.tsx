"use client";

import { useState } from "react";
import Link from "next/link";

export function SellerContact({ listingId, isAuthenticated, locale = "uz" }: { listingId: string; isAuthenticated: boolean; locale?: "uz" | "ru" }) {
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ru = locale === "ru";

  async function reveal() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/avtobozor/contact?id=" + encodeURIComponent(listingId), { method: "GET", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (ru ? "Не удалось получить контакт" : "Kontaktni olib bo‘lmadi"));
      setContact({ name: data.name, phone: data.phone });
    } catch (e) {
      setError(e instanceof Error ? e.message : (ru ? "Ошибка запроса" : "So‘rovda xatolik"));
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <Link href={"/account/login?next=" + encodeURIComponent("/avtobozor")} className="mt-5 block rounded-full bg-blue-700 px-5 py-3 text-center font-bold text-white">{ru ? "Войдите, чтобы увидеть контакт продавца" : "Sotuvchi kontaktini ko‘rish uchun tizimga kiring"}</Link>;
  }

  return <div className="mt-5">
    {contact ? <><p className="font-bold">{contact.name}</p><a href={"tel:" + contact.phone} className="mt-2 block rounded-full bg-blue-700 px-5 py-3 text-center font-bold text-white">{contact.phone} · {ru ? "Позвонить" : "Qo‘ng‘iroq qilish"}</a></> : <button type="button" onClick={reveal} disabled={loading} className="block w-full rounded-full bg-blue-700 px-5 py-3 text-center font-bold text-white disabled:opacity-60">{loading ? (ru ? "Загрузка..." : "Yuklanmoqda...") : (ru ? "Показать контакт продавца" : "Sotuvchi kontaktini ko‘rish")}</button>}
    {error ? <p role="alert" className="mt-2 text-xs text-red-600">{error}</p> : null}
  </div>;
}
