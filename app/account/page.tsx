import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale } from "@/lib/locale";
import { signOutCustomerAction } from "@/app/account/sign-out-action";

function Icon({ name }: { name: string }) {
  const common = "h-7 w-7";
  const paths: Record<string, ReactNode> = {
    heart: <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-4.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8M8 14h5" /></>,
    gift: <><path d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12" /><path d="M12 8H8.5A2.5 2.5 0 1 1 11 5.5V8ZM12 8h3.5A2.5 2.5 0 1 0 13 5.5V8Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    settings: <><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.3a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 3.7 11H3.5a2 2 0 1 1 0-4h.3a2 2 0 0 0 1.4-3.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 11.4 2h.3a2 2 0 1 1 4 0v.3a2 2 0 0 0 3.4 1.4l.1-.1A2 2 0 1 1 22 6.4l-.1.1A2 2 0 0 0 20.5 10h.3a2 2 0 1 1 0 4h-.3a2 2 0 0 0-1.1 1Z" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    calculator: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2" /></>,
    document: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5M10 13h5M10 17h5" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={common}>{paths[name]}</svg>;
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const locale = await getLocale();
  const ru = locale === "ru";
  const phone = customer.phone ?? "";

  const items = [
    { icon: "heart", uz: "Sevimlilar", ru: "Избранное", href: "/cars" },
    { icon: "bell", uz: "Bildirishnoma", ru: "Уведомления", href: "#" },
    { icon: "chat", uz: "Savol va javoblar", ru: "Вопросы и ответы", href: "/faq" },
    { icon: "gift", uz: "Bonuslar", ru: "Бонусы", href: "#" },
    { icon: "mail", uz: "Biz bilan bog'lanish", ru: "Связаться с нами", href: "https://t.me/CarDriveUzBot" },
    { icon: "settings", uz: "Sozlamalar", ru: "Настройки", href: "#" },
    { icon: "card", uz: "Kredit", ru: "Кредит", href: "/avtokredit" },
    { icon: "calculator", uz: "Kalkulyator", ru: "Калькулятор", href: "/avtokredit/kalkulyator" },
    { icon: "document", uz: "Hujjat", ru: "Документы", href: "/privacy" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-8 pt-5 text-white sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-3xl">👤</div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold tracking-tight">{phone}</p>
              <p className="mt-1 text-sm text-slate-400">{ru ? "Вы вошли по номеру телефона" : "Telefon raqamingiz orqali tizimga kirgansiz"}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Link href="/account/orders" className="flex items-center justify-between rounded-2xl bg-slate-800 px-4 py-4 transition hover:bg-slate-700">
              <span className="font-semibold">👤 {ru ? "Мои данные" : "Mening ma'lumotlarim"}</span>
              <span className="text-slate-400">⌄</span>
            </Link>
            <div className="flex items-center justify-between rounded-2xl bg-slate-800 px-4 py-4">
              <span className="font-semibold">🇺🇿 {ru ? "Язык: Русский" : "Til: O'zbek"}</span>
              <span className="text-slate-400">⌄</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
            {items.map((item) => (
              <Link
                key={item.uz}
                href={item.href}
                className="flex min-h-28 flex-col items-center justify-center gap-2 border-b border-r border-white/10 px-2 py-4 text-center transition hover:bg-slate-700"
                target={item.href.startsWith("https://") ? "_blank" : undefined}
                rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
              >
                <span className="text-sky-300"><Icon name={item.icon} /></span>
                <span className="text-sm font-semibold leading-tight">{ru ? item.ru : item.uz}</span>
              </Link>
            ))}
          </div>

          <form action={signOutCustomerAction} className="mt-4">
            <button className="w-full rounded-2xl bg-slate-800 px-4 py-4 font-semibold text-white transition hover:bg-slate-700">
              {ru ? "Выйти" : "Chiqish"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
