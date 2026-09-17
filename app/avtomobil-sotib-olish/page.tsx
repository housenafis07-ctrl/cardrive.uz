import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Avtomobil sotib olish onlayn — yangi mashinalar va narxlar | Cardrive.uz",
  description: "O‘zbekistonda yangi avtomobil sotib olishni onlayn boshlang. Chevrolet, BYD, Kia va boshqa avtomobillar narxi, komplektatsiyasi va moliyalashtirish imkoniyatlarini Cardrive.uz’da ko‘ring.",
  keywords: ["avtomobil sotib olish", "avtomobil sotib olish onlayn", "mashina sotib olish", "yangi avtomobil sotib olish", "yangi mashinalar", "avtomobil narxlari", "mashina narxlari", "O‘zbekistonda avtomobil sotib olish"],
  alternates: { canonical: "/avtomobil-sotib-olish" },
};

const copy={
  uz:{eyebrow:"CARD RIVE KATALOG",title:"Avtomobil sotib olish — yangi mashinalarni onlayn tanlang",intro:"Cardrive.uz’da O‘zbekistondagi yangi avtomobillarni narxi, komplektatsiyasi va texnik xususiyatlari bo‘yicha taqqoslang. Mos avtomobilni topib, buyurtma yoki maslahat olish uchun sahifasidan foydalaning.",priceTitle:"Narxlarni solishtiring",priceText:"Bir nechta avtomobil va komplektatsiyani taqqoslang.",carTitle:"Avtomobilni tanlang",carText:"Brend, kuzov, texnik xususiyat va mavjudlik bo‘yicha qidiring.",financeTitle:"Moliyalashtirish",financeText:"Avtokredit va rassrochka dasturlari mavjud bo‘lsa, avtomobil sahifasida ko‘ring.",button:"Yangi avtomobillar katalogi →"},
  ru:{eyebrow:"КАТАЛОГ CARD RIVE",title:"Покупка автомобиля — выбирайте новые автомобили онлайн",intro:"На Cardrive.uz сравнивайте новые автомобили в Узбекистане по цене, комплектации и техническим характеристикам. Выберите подходящий автомобиль и оформите заказ или получите консультацию на его странице.",priceTitle:"Сравнивайте цены",priceText:"Сравнивайте несколько автомобилей и комплектаций.",carTitle:"Выберите автомобиль",carText:"Ищите по бренду, типу кузова, техническим характеристикам и наличию.",financeTitle:"Финансирование",financeText:"Если доступны программы автокредита или рассрочки, они указаны на странице автомобиля.",button:"Каталог новых автомобилей →"}
} as const;

export default async function AvtomobilSotibOlishPage() {
  const locale=await getLocale();
  const x=copy[locale];
  return <><Header /><main className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-sky-700">{x.eyebrow}</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{x.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{x.intro}</p><div className="mt-10 grid gap-5 sm:grid-cols-3"><div className="rounded-2xl border p-5"><h2 className="font-black">{x.priceTitle}</h2><p className="mt-2 text-sm text-slate-600">{x.priceText}</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">{x.carTitle}</h2><p className="mt-2 text-sm text-slate-600">{x.carText}</p></div><div className="rounded-2xl border p-5"><h2 className="font-black">{x.financeTitle}</h2><p className="mt-2 text-sm text-slate-600">{x.financeText}</p></div></div><Link href="/cars" className="mt-10 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">{x.button}</Link></main><Footer /></>;
}
