import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { AccountLoginGate } from "@/components/account-login-gate";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale } from "@/lib/locale";
import { translations } from "@/lib/i18n";
import { signOutCustomerAction } from "@/app/account/sign-out-action";

function Tile({ href, icon, title, description }: { href: string; icon: string; title: string; description?: string }) {
  return <Link href={href} className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center transition hover:bg-white/[0.1]">
    <span className="text-2xl" aria-hidden="true">{icon}</span>
    <span className="mt-2 text-sm font-semibold text-white">{title}</span>
    {description ? <span className="mt-1 text-[11px] text-slate-400">{description}</span> : null}
  </Link>;
}

export default async function AccountPage() {
  const locale = await getLocale();
  const x = translations[locale];
  const customer = await getCurrentCustomer();

  return <>
    <Header />
    <main className="min-h-[70vh] bg-[#0b0f14] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-xl">
        {!customer ? <AccountLoginGate locale={locale} /> : <>
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0877F9] text-2xl">👤</div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{locale === "ru" ? "Вы вошли по номеру телефона" : "Telefon raqami orqali kirilgansiz"}</p>
                <p className="mt-1 truncate text-xl font-bold">{customer.phone ?? "—"}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <Tile href="/account/orders" icon="📋" title={x.orders} />
            <Tile href="/cars" icon="❤️" title={locale === "ru" ? "Избранное" : "Sevimlilar"} />
            <Tile href="/avtokredit/kalkulyator" icon="🧮" title={x.creditCalculator} />
            <Tile href="/avtokredit" icon="🏦" title={x.creditPrograms} />
            <Tile href="/faq" icon="💬" title={locale === "ru" ? "Вопросы и ответы" : "Savollar va javoblar"} />
            <Tile href="/privacy" icon="⚙️" title={locale === "ru" ? "Настройки" : "Sozlamalar"} />
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold">{locale === "ru" ? "Быстрые действия" : "Tezkor amallar"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/cars" className="rounded-full bg-white/10 px-4 py-2 text-sm">{x.allCars}</Link>
              <Link href="/avtokredit/kalkulyator" className="rounded-full bg-white/10 px-4 py-2 text-sm">{x.creditCalculator}</Link>
              <form action={signOutCustomerAction}><button className="rounded-full bg-white/10 px-4 py-2 text-sm">{x.logout}</button></form>
            </div>
          </section>
        </>}
      </div>
    </main>
    <Footer />
  </>;
}
