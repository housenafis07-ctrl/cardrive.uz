import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Avtomobil rassrochka — 0% va bo‘lib to‘lash takliflari | Cardrive.uz",
  description: "Avtomobilni rassrochka orqali sotib olish imkoniyatlarini ko‘ring. 0% rassrochka yoki foizsiz taklif mavjud bo‘lsa, Cardrive.uz avtomobil sahifalarida ko‘rsatiladi.",
  keywords: ["rassrochka", "avtomobil rassrochka", "avto rassrochka", "0% rassrochka", "0 foiz rassrochka", "foizsiz avtomobil", "avtomobilni bo‘lib to‘lash", "mashina rassrochka"],
  alternates: { canonical: "/rassrochka" },
};

export default function RassrochkaPage() {
  return <><Header /><main className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-emerald-600">CARD RIVE MOLIYALASHTIRISH</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Avtomobil rassrochka — bo‘lib to‘lash imkoniyatlari</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Yangi avtomobillarni tanlang va mavjud rassrochka hamda moliyalashtirish dasturlarini avtomobil sahifasida ko‘ring. 0% taklif mavjud bo‘lsa, tegishli dastur shartlari alohida ko‘rsatiladi.</p><section className="mt-10 rounded-3xl bg-slate-50 p-7"><h2 className="text-2xl font-black">0% rassrochka nimani anglatadi?</h2><p className="mt-3 leading-7 text-slate-600">0% yoki foizsiz dasturda foiz stavkasi nol bo‘lishi mumkin, biroq boshlang‘ich to‘lov, muddat, komissiya va boshqa shartlar alohida bo‘lishi ehtimoli mavjud. Shuning uchun yakuniy shartlarni moliyalashtiruvchi bank yoki hamkor tashkilotdan tekshirish kerak.</p></section><section className="mt-8"><h2 className="text-2xl font-black">Avtomobilni tanlang</h2><p className="mt-2 text-slate-600">Narx, komplektatsiya va mavjud moliyalashtirish imkoniyatlarini ko‘rish uchun katalogga o‘ting.</p><Link href="/cars" className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">Katalogni ochish →</Link></section></main><Footer /></>;
}
