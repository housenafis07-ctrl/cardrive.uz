import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale } from "@/lib/locale";
import { UsedCarListingForm } from "@/components/used-car-listing-form";

export const metadata = { title: "Avtobozor — E'lon joylashtirish | Cardrive.uz" };

export default async function NewUsedCarListingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  const ru = locale === "ru";
  const customer = await getCurrentCustomer();
  const params = await searchParams;
  return <><Header /><main className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8">
    <Link href="/avtobozor" className="text-sm font-semibold text-blue-700">← {ru ? "Авторынок" : "Avtobozor"}</Link>
    <h1 className="mt-3 break-words text-3xl font-black">{ru ? "Разместить объявление" : "Avtomobil e'lonini joylashtirish"}</h1>
    <p className="mt-2 text-slate-600">{ru ? "Заполните данные автомобиля. После проверки модератором объявление появится в каталоге." : "Avtomobil ma'lumotlarini kiriting. Moderator tekshiruvidan so'ng e'lon Avtobozorda ko'rinadi."}</p>
    <UsedCarListingForm locale={locale} isAuthenticated={!!customer} error={params.error} />
  </main><Footer /></>;
}
