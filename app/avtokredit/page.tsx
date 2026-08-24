import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Avtokredit — eng qulay avtokredit va avtomobil krediti | O‘zbekiston",
  description: "O‘zbekistonda avtomobil uchun avtokredit variantlarini solishtiring. Boshlang‘ich to‘lov, foiz stavkasi, kredit muddati va oylik to‘lovni ko‘rib, mos avtomobilni tanlang.",
  keywords: ["avtokredit", "avtokredit O‘zbekiston", "eng arzon avtokredit", "avtokredit foiz stavkasi", "avtokredit kalkulyator", "avtomobil krediti", "yangi avtomobil uchun kredit", "avtokredit shartlari"],
  alternates: { canonical: "/avtokredit" },
};

export default function AvtokreditPage() {
  return <><Header /><main className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-amber-600">CARD RIVE MOLIYALASHTIRISH</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Avtokredit — avtomobilni qulay shartlarda sotib oling</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Cardrive.uz’da yangi avtomobillarni ko‘ring va mavjud bank moliyalashtirish dasturlarini taqqoslang. Foiz stavkasi, boshlang‘ich to‘lov va kredit muddatini avtomobil bo‘yicha ko‘rib chiqing.</p><section className="mt-10 grid gap-5 sm:grid-cols-3"><div className="rounded-2xl border p-5"><h2 className="font-black">Avtokredit</h2><p className="mt-2 text-sm text-slate-600">Turli bank dasturlarini avtomobil bo‘yicha solishtiring.</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">Oylik to‘lov</h2><p className="mt-2 text-sm text-slate-600">Boshlang‘ich to‘lov va muddatga qarab to‘lovni baholang.</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">0% takliflar</h2><p className="mt-2 text-sm text-slate-600">0% yoki foizsiz dastur mavjud bo‘lsa, u avtomobil sahifasida ko‘rsatiladi.</p></div></section><section className="mt-10 rounded-3xl bg-slate-50 p-7"><h2 className="text-2xl font-black">Eng arzon avtokreditni qanday tanlash kerak?</h2><p className="mt-3 leading-7 text-slate-600">Faqat nominal foiz stavkasiga emas, boshlang‘ich to‘lov, kredit muddati, oylik to‘lov va boshqa xarajatlarga ham qarang. Cardrive.uz’dagi ma’lumotlar tanlash va taqqoslash uchun beriladi; yakuniy kredit shartlari bank tomonidan tasdiqlanadi.</p></section><Link href="/cars" className="mt-8 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">Avtomobillarni ko‘rish →</Link></main><Footer /></>;
}
