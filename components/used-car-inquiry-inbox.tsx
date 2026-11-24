"use client";

import { useEffect, useState } from "react";

type Inquiry = {
  id: string; listing_id: string; buyer_profile_id: string; seller_profile_id: string;
  message: string; status: string; created_at: string; used_car_listings?: { brand: string; model: string; year: number; slug: string } | null;
};
type Message = { id: string; sender_profile_id: string; message: string; created_at: string };

export function UsedCarInquiryInbox({ customerId, locale = "uz" }: { customerId: string; locale?: "uz" | "ru" }) {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [active, setActive] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const ru = locale === "ru";

  async function loadInbox() {
    const response = await fetch("/api/avtobozor/inquiries", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Inbox error");
    setItems(data.inquiries || []);
  }
  async function openThread(item: Inquiry) {
    setActive(item); setNotice("");
    const response = await fetch("/api/avtobozor/inquiries/" + item.id + "/messages", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "Xabarlarni yuklab bo‘lmadi"); return; }
    setMessages([{ id: "opening-" + item.id, sender_profile_id: item.buyer_profile_id, message: item.message, created_at: item.created_at }, ...(data.messages || [])]);
  }
  useEffect(() => { loadInbox().catch(error => setNotice(error.message)); }, []);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !draft.trim() || busy) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/avtobozor/inquiries/" + active.id + "/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: draft }), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Xabar yuborilmadi");
      setDraft("");
      await openThread(active);
      await loadInbox();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Xatolik"); }
    finally { setBusy(false); }
  }

  return <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h2 className="border-b px-4 py-3 font-black">{ru ? "Обращения" : "Murojaatlar"} ({items.length})</h2>
      {items.length ? items.map(item => {
        const car = item.used_car_listings;
        const isBuyer = item.buyer_profile_id === customerId;
        return <button key={item.id} onClick={() => openThread(item)} className={"block w-full border-b p-4 text-left hover:bg-slate-50 " + (active?.id === item.id ? "bg-blue-50" : "")}>
          <span className="block font-bold">{car ? car.brand + " " + car.model + " · " + car.year : (ru ? "Объявление" : "E’lon")}</span>
          <span className="mt-1 block text-xs text-slate-500">{isBuyer ? (ru ? "Вы написали продавцу" : "Siz sotuvchiga yozgansiz") : (ru ? "Входящее обращение" : "Sizga kelgan murojaat")}</span>
          <span className="mt-2 block truncate text-sm text-slate-600">{item.message}</span>
          <span className="mt-2 block text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString(ru ? "ru-RU" : "uz-UZ")}</span>
        </button>;
      }) : <p className="p-6 text-sm text-slate-500">{ru ? "Обращений пока нет" : "Hozircha murojaatlar yo‘q"}</p>}
    </section>
    <section className="flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white">
      <h2 className="border-b px-4 py-3 font-black">{active ? (ru ? "Переписка" : "Yozishmalar") : (ru ? "Выберите обращение" : "Murojaatni tanlang")}</h2>
      {active ? <>
        <div className="flex-1 space-y-3 p-4">
          {messages.map(message => <div key={message.id} className={"max-w-[88%] rounded-2xl px-3 py-2 text-sm " + (message.sender_profile_id === customerId ? "ml-auto bg-blue-700 text-white" : "bg-slate-100 text-slate-800")}>
            <p className="whitespace-pre-wrap">{message.message}</p>
            <p className={"mt-1 text-[10px] " + (message.sender_profile_id === customerId ? "text-blue-100" : "text-slate-400")}>{new Date(message.created_at).toLocaleString(ru ? "ru-RU" : "uz-UZ")}</p>
          </div>)}
        </div>
        {active.status !== "closed" ? <form onSubmit={send} className="border-t p-3">
          <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder={ru ? "Введите сообщение..." : "Xabar yozing..."} className="w-full rounded-xl border border-slate-300 p-3 text-sm"/>
          <button disabled={busy || !draft.trim()} className="mt-2 rounded-full bg-blue-700 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? (ru ? "Отправка..." : "Yuborilmoqda...") : (ru ? "Отправить" : "Yuborish")}</button>
        </form> : <p className="border-t p-3 text-sm text-slate-500">{ru ? "Обращение закрыто" : "Murojaat yopilgan"}</p>}
      </> : <p className="p-6 text-sm text-slate-500">{ru ? "Выберите обращение слева, чтобы открыть переписку" : "Yozishmalarni ko‘rish uchun chap tomondan murojaatni tanlang"}</p>}
      {notice ? <p role="alert" className="px-4 pb-3 text-xs text-red-600">{notice}</p> : null}
    </section>
  </div>;
}
