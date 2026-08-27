import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "FAQ — Avtomobil, avtokredit va rassrochka haqida savollar",
  description: "Cardrive.uz FAQ: yangi avtomobil narxi, avtokredit, kredit dasturlari, kredit kalkulyatori, boshlang‘ich to‘lov va rassrochka haqida ko‘p beriladigan savollarga javoblar.",
  keywords: ["avtomobil FAQ", "avtokredit FAQ", "avtokredit savol javob", "kredit dasturlari", "kredit kalkulyatori", "avtomobil rassrochka", "yangi avtomobil sotib olish"],
  alternates: { canonical: "/faq" },
};

const FAQ = {
  uz: [
    ["Cardrive.uz nima?", "Cardrive.uz O‘zbekistonda yangi avtomobillarni narxi, komplektatsiyasi, texnik xususiyatlari va mavjud moliyalashtirish shartlari bilan tanlashga yordam beradigan avtomobil katalogi."],
    ["Avtomobil kreditini qanday tanlash mumkin?", "Avtomobil sahifasida mavjud kredit dasturlarini solishtiring: foiz stavkasi, boshlang‘ich to‘lov, kredit muddati va oylik to‘lovni ko‘rib, o‘zingizga mos variantni tanlang."],
    ["Kredit dasturlari nimani ko‘rsatadi?", "Kredit dasturlari bank yoki dilerning avtomobil uchun amaldagi shartlarini ko‘rsatadi. Har bir dasturda foiz stavkasi, boshlang‘ich to‘lov, muddat va boshqa shartlar bo‘lishi mumkin."],
    ["Kredit kalkulyatori qanday ishlaydi?", "Avtomobil sahifasidagi kredit kalkulyatori tanlangan kredit dasturi qoidalariga asoslanib boshlang‘ich to‘lov, muddat va foiz stavkasini hisobga oladi hamda taxminiy oylik to‘lovni ko‘rsatadi."],
    ["0% avtokredit yoki foizsiz rassrochka bormi?", "Agar avtomobil uchun faol 0% yoki foizsiz dastur mavjud bo‘lsa, u avtomobil sahifasida ko‘rsatiladi. Boshlang‘ich to‘lov, muddat, komissiya va boshqa shartlarni albatta tekshirish kerak."],
    ["Kredit uchun arizani qanday topshiraman?", "Avval avtomobil va mos kredit dasturini tanlab buyurtma bering. Menejer buyurtmani tekshirganidan keyin kredit arizasini davom ettirish imkoniyati faollashadi."],
    ["Buyurtmam holatini qayerdan ko‘raman?", "Hisobingizga kirgandan so‘ng yuqoridagi “Buyurtmalarim” bo‘limida buyurtma holati va kredit arizasi bosqichlarini ko‘rishingiz mumkin."],
    ["Kredit arizasi bankka yuborilgandan keyin nima bo‘ladi?", "Ariza bankka yuborilgach, uning holati tizimda yangilanadi. Yakuniy kredit qarorini bank qabul qiladi."],
  ],
  ru: [
    ["Что такое Cardrive.uz?", "Cardrive.uz — каталог новых автомобилей в Узбекистане с ценами, комплектациями, техническими характеристиками и доступными вариантами финансирования."],
    ["Как выбрать автокредит?", "На странице автомобиля сравните доступные кредитные программы по ставке, первоначальному взносу, сроку и расчётному ежемесячному платежу."],
    ["Что показывают кредитные программы?", "Кредитные программы показывают действующие условия банка или дилера для автомобиля: процентную ставку, первоначальный взнос, срок и другие условия."],
    ["Как работает кредитный калькулятор?", "Кредитный калькулятор на странице автомобиля учитывает правила выбранной программы, первоначальный взнос, срок и процентную ставку и показывает расчётный ежемесячный платёж."],
    ["Есть ли автокредит 0% или беспроцентная рассрочка?", "Если для автомобиля доступна действующая программа 0% или беспроцентная рассрочка, она отображается на странице автомобиля. Важно проверить первоначальный взнос, срок, комиссии и другие условия."],
    ["Как подать заявку на кредит?", "Выберите автомобиль и подходящую кредитную программу и оформите заказ. После проверки заказа менеджером станет доступно продолжение кредитной заявки."],
    ["Где посмотреть статус заказа?", "После входа в аккаунт откройте раздел «Мои заказы», где отображаются статус заказа и этапы кредитной заявки."],
    ["Что происходит после отправки кредитной заявки в банк?", "После отправки заявки в банк её статус обновляется в системе. Окончательное решение по кредиту принимает банк."],
  ],
} as const;

export default async function FaqPage(){
  const locale=await getLocale();
  const items=FAQ[locale];
  const title=locale==="ru"?"FAQ — Частые вопросы об автомобилях и автокредите":"FAQ — Ko‘p beriladigan savollar";
  const structuredData={"@context":"https://schema.org","@type":"FAQPage",mainEntity:items.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}}))};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/><Header/><main className="mx-auto max-w-4xl px-5 py-12"><p className="text-sm font-black uppercase tracking-wide text-amber-600">FAQ</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1><div className="mt-10 space-y-4">{items.map(([question,answer])=><details key={question} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-black">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div><Link href="/cars" className="mt-8 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">{locale==="ru"?"Открыть каталог":"Katalogni ochish"} →</Link></main><Footer/></>;
}
