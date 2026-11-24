import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale } from "@/lib/locale";
import { UsedCarInquiryInbox } from "@/components/used-car-inquiry-inbox";

export const dynamic = "force-dynamic";

export default async function AccountInquiriesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount%2Finquiries");
  const locale = await getLocale();
  const ru = locale === "ru";
  return <><Header/><main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8 sm:px-6">
    <h1 className="text-3xl font-black">{ru ? "Мои обращения" : "Murojaatlarim"}</h1>
    <p className="mt-2 text-sm text-slate-500">{ru ? "Переписка с продавцами по объявлениям Avtobozor" : "Avtobozor e’lonlari bo‘yicha xaridor va sotuvchilar yozishmalari"}</p>
    <UsedCarInquiryInbox customerId={customer.id} locale={locale}/>
  </main><Footer/></>;
}
