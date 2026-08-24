import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Avtomobil sotib olish onlayn — yangi mashinalar va narxlar | Cardrive.uz",
  description: "O‘zbekistonda yangi avtomobil sotib olishni onlayn boshlang. Chevrolet, BYD, Kia va boshqa avtomobillar narxi, komplektatsiyasi va moliyalashtirish imkoniyatlarini Cardrive.uz’da ko‘ring.",
  keywords: ["avtomobil sotib olish", "avtomobil sotib olish onlayn", "mashina sotib olish", "yangi avtomobil sotib olish", "yangi mashinalar", "avtomobil narxlari", "mashina narxlari", "O‘zbekistonda avtomobil sotib olish"],
  alternates: { canonical: "/avtomobil-sotib-olish" },
};

export default function AvtomobilSotibOlishPage() {
  return <><Header /><main className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-sky-700">CARD RIVE KATALOG</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Avtomobil sotib olish — yangi mashinalarni onlayn tanlang</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Cardrive.uz’da O‘zbekistondagi yangi avtomobillarni narxi, komplektatsiyasi va texnik xususiyatlari bo‘yicha taqqoslang. Mos avtomobilni topib, buyurtma yoki maslahat olish uchun sahifasidan foydalaning.</p><div className="mt-10 grid gap-5 sm:grid-cols-3"><div className="rounded-2xl border p-5"><h2 className="font-black">Narxlarni solishtiring</h2><p className="mt-2 text-sm text-slate-600">Bir nechta avtomobil va komplektatsiyani taqqoslang.</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">Avtomobilni tanlang</h2><p className="mt-2 text-sm text-slate-600">Brend, kuzov, texnik xususiyat va mavjudlik bo‘yicha qidiring.</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">Moliyalashtirish</h2><p className="mt-2 text-sm text-slate-600">Avtokredit va rassrochka dasturlari mavjud bo‘lsa, avtomobil sahifasida ko‘ring.</p></div></div><Link href="/cars" className="mt-10 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">Yangi avtomobillar katalogi →</Link></main><Footer /></>;
}
