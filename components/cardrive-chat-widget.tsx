"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Context = {
  carName?: string;
  carUrl?: string;
  pageTitle?: string;
  initialMessage?: string;
};

const TELEGRAM_BOT_URL = "https://t.me/CarDriveUzBot";

export function CardriveChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<Context>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<Context>).detail ?? {};
      setContext(detail);
      setMessage(detail.initialMessage ?? "");
      setOpen(true);
      setSent(false);
      setError("");
    };

    window.addEventListener("cardrive:open-chat", onOpen);
    return () => window.removeEventListener("cardrive:open-chat", onOpen);
  }, []);

  function close() {
    setOpen(false);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/crm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message, ...context }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Xabar yuborilmadi");
      setSent(true);
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2">
        <a
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cardrive Telegram botini ochish"
          title="Telegram orqali murojaat qilish"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-[#229ED9] px-4 py-3 text-sm font-bold text-white shadow-xl shadow-sky-900/20 transition hover:-translate-y-0.5 hover:bg-[#168ac4] focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
            <path d="M21.6 4.2 18.4 19c-.24 1.05-.86 1.3-1.74.81l-4.82-3.55-2.33 2.24c-.26.26-.48.48-.98.48l.35-4.9 8.92-8.06c.39-.35-.09-.54-.6-.2L6.18 12.9l-4.7-1.47c-1.02-.32-1.04-1.02.21-1.51L20.1 2.8c.85-.31 1.6.2 1.5 1.4Z" />
          </svg>
          <span>Telegram</span>
        </a>

        <button
          type="button"
          onClick={() => {
            setContext({});
            setOpen(true);
            setSent(false);
            setError("");
          }}
          aria-label="Cardrive chatni ochish"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0877F9] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
          </svg>
          Xabar qoldirish
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-end bg-slate-950/30 p-0 sm:items-end sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cardrive-chat-title"
            className="flex max-h-[min(720px,92dvh)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[390px] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between bg-[#0877F9] px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold text-blue-100">CARDRIVE.UZ</p>
                <h2 id="cardrive-chat-title" className="text-lg font-extrabold">Cardrive maslahat markazi</h2>
                <p className="text-xs text-blue-100">Murojaatingizni qoldiring</p>
              </div>
              <button type="button" onClick={close} aria-label="Chatni yopish" className="rounded-full p-2 text-2xl leading-none hover:bg-white/15">×</button>
            </header>

            <div className="space-y-3 overflow-y-auto bg-slate-50 p-5 text-sm">
              <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
                <p>Assalomu alaykum! 👋</p>
                <p className="mt-1">Cardrive’ga murojaat qilganingizdan xursandmiz. Ismingiz, telefon raqamingiz va savolingizni qoldiring — menejerimiz siz bilan bog‘lanadi.</p>
              </div>
              {context.carName ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                  <strong>Tanlangan avtomobil:</strong> {context.carName}
                </div>
              ) : null}
              {sent ? (
                <div role="status" className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                  <strong>✅ Murojaatingiz qabul qilindi!</strong>
                  <p className="mt-1">Menejerimiz tez orada siz bilan bog‘lanadi.</p>
                </div>
              ) : null}
            </div>

            {!sent ? (
              <form onSubmit={submit} className="space-y-3 border-t bg-white p-5">
                <label className="block text-xs font-bold text-slate-700">
                  Ismingiz
                  <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ismingiz" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Telefon raqamingiz
                  <input required type="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+998 90 123 45 67" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Xabaringiz
                  <textarea required maxLength={3000} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Qanday yordam bera olamiz?" className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {busy ? "Yuborilmoqda…" : "Xabarni yuborish"}
                </button>
                <p className="text-center text-[11px] text-slate-400">Ma’lumotlaringiz murojaatingizga javob berish uchun ishlatiladi.</p>
              </form>
            ) : (
              <div className="p-5">
                <button type="button" onClick={close} className="w-full rounded-xl border px-4 py-3 text-sm font-bold">Yopish</button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
