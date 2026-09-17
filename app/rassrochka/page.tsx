import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Avtomobil rassrochka — 0% va bo‘lib to‘lash takliflari | Cardrive.uz",
  description: "Avtomobilni rassrochka orqali sotib olish imkoniyatlarini ko‘ring. 0% rassrochka yoki foizsiz taklif mavjud bo‘lsa, Cardrive.uz avtomobil sahifalarida ko‘rsatiladi.",
  keywords: ["rassrochka", "avtomobil rassrochka", "avto rassrochka", "0% rassrochka", "0 foiz rassrochka", "foizsiz avtomobil", "avtomobilni bo‘lib to‘lash", "mashina rassrochka"],
  alternates: { canonical: "/rassrochka" },
};

const copy={
  uz:{eyebrow:"CARD RIVE MOLIYALASHTIRISH",title:"Avtomobil rassrochka — bo‘lib to‘lash imkoniyatlari",intro:"Yangi avtomobillarni tanlang va mavjud rassrochka hamda moliyalashtirish dasturlarini avtomobil sahifasida ko‘ring. 0% taklif mavjud bo‘lsa, tegishli dastur shartlari alohida ko‘rsatiladi.",sectionTitle:"0% rassrochka nimani anglatadi?",sectionText:"0% yoki foizsiz dasturda foiz stavkasi nol bo‘lishi mumkin, biroq boshlang‘ich to‘lov, muddat, komissiya va boshqa shartlar alohida bo‘lishi ehtimoli mavjud. Shuning uchun yakuniy shartlarni moliyalashtiruvchi bank yoki hamkor tashkilotdan tekshirish kerak.",chooseTitle:"Avtomobilni tanlang",chooseText:"Narx, komplektatsiya va mavjud moliyalashtirish imkoniyatlarini ko‘rish uchun katalogga o‘ting.",button:"Katalogni ochish →"},
  ru:{eyebrow:"ФИНАНСИРОВАНИЕ CARD RIVE",title:"Автомобиль в рассрочку — возможности оплаты частями",intro:"Выбирайте новые автомобили и смотрите доступные программы рассрочки и финансирования на странице автомобиля. Если доступно предложение под 0%, его условия будут указаны отдельно.",sectionTitle:"Что означает рассрочка 0%?",sectionText:"В программе под 0% процентная ставка может быть нулевой, однако первоначальный взнос, срок, комиссия и другие условия могут отличаться. Поэтому окончательные условия следует уточнять у финансирующего банка или партнёра.",chooseTitle:"Выберите автомобиль",chooseText:"Перейдите в каталог, чтобы посмотреть цены, комплектации и доступные варианты финансирования.",button:"Открыть каталог →"}
} as const;

export default async function RassrochkaPage() {
  const locale=await getLocale();
  const x=copy[locale];
  return <><Header /><main className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-emerald-600">{x.eyebrow}</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{x.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{x.intro}</p><section className="mt-10 rounded-3xl bg-slate-50 p-7"><h2 className="text-2xl font-black">{x.sectionTitle}</h2><p className="mt-3 leading-7 text-slate-600">{x.sectionText}</p></section><section className="mt-8"><h2 className="text-2xl font-black">{x.chooseTitle}</h2><p className="mt-2 text-slate-600">{x.chooseText}</p><Link href="/cars" className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">{x.button}</Link></section></main><Footer /></>;
}
