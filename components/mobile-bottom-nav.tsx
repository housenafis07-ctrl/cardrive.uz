"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type Props = { locale: Locale };

type Item = {
  href: string;
  uz: string;
  ru: string;
  icon: "home" | "credit" | "search" | "orders" | "profile";
};

const items: Item[] = [
  { href: "/", uz: "Asosiy", ru: "Главная", icon: "home" },
  { href: "/avtokredit", uz: "Kredit", ru: "Кредит", icon: "credit" },
  { href: "/cars", uz: "Qidiruv", ru: "Поиск", icon: "search" },
  { href: "/account/orders", uz: "Buyurtmalarim", ru: "Мои заказы", icon: "orders" },
  { href: "/account", uz: "Profil", ru: "Профиль", icon: "profile" },
];

function Icon({ name, active }: { name: Item["icon"]; active: boolean }) {
  const common = {
    className: `h-5 w-5 ${active ? "text-[#0877F9]" : "text-slate-400"}`,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>;
  if (name === "credit") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" strokeLinecap="round" /></svg>;
  if (name === "orders") return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3.5h6M8.5 9h7M8.5 13h7M8.5 17h4" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5 20c.8-3.5 3.1-5.2 7-5.2s6.2 1.7 7 5.2" /></svg>;
}

export function MobileBottomNav({ locale }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="h-[82px] md:hidden" aria-hidden="true" />
      <nav
        aria-label={locale === "ru" ? "Основная навигация" : "Asosiy navigatsiya"}
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#0b0f14]/95 shadow-[0_-8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid h-[68px] max-w-xl grid-cols-5 px-1">
          {items.map((item) => {
            const active = isActive(item.href);
            const label = locale === "ru" ? item.ru : item.uz;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${active ? "text-white" : "text-slate-400"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`flex h-8 w-10 items-center justify-center rounded-full ${active ? "bg-[#0877F9]/15" : ""}`}>
                  <Icon name={item.icon} active={active} />
                </span>
                <span className="truncate max-w-full">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
