import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";

export const metadata = {
  title: "FAQ — Cardrive.uz",
  description: "Yangi avtomobillar, avtokredit, narxlar va buyurtmalar haqida tez-tez so‘raladigan savollar.",
};

export default async function FAQPage() {
  const locale = await getLocale();
  const ru = locale === "ru";
  const items = ru ? [
    ["Что такое Cardrive.uz?", "Cardrive.uz — автомобильный маркетплейс в Узбекистане, где можно выбирать новые автомобили, сравнивать цены и смотреть кредитные программы."],
    ["Можно ли купить автомобиль в кредит?", "Да. На странице автомобиля можно посмотреть доступные кредитные программы, первоначальный взнос, срок кредита и ежемесячный платёж."],
    ["Какой нужен первоначальный взнос?", "Размер первоначального взноса зависит от автомобиля и выбранной банковской кредитной программы."],
    ["Как найти электромобиль?", "Откройте раздел «Электрические» в каталоге, чтобы посмотреть электромобили."],
    ["Как проверить статус заказа?", "Войдите в аккаунт и откройте раздел «Мои заказы», где можно отслеживать заказ и кредитную заявку."],
    ["Гарантировано ли получение кредита?", "Нет. Окончательное решение о выдаче кредита принимает выбранный банк или финансовая организация."],
  ] : [
    ["Cardrive.uz nima?", "Cardrive.uz — O‘zbekistonda yangi avtomobillarni tanlash, narxlarini solishtirish va kredit dasturlarini ko‘rish imkonini beruvchi avtomobil marketplace."],
    ["Avtomobilni kreditga olish mumkinmi?", "Ha. Avtomobil sahifasida mavjud kredit dasturlari, boshlang‘ich to‘lov, kredit muddati va oylik to‘lovni ko‘rish mumkin."],
    ["Boshlang‘ich to‘lov qancha?", "Boshlang‘ich to‘lov avtomobil va tanlangan bank kredit dasturiga qarab farq qiladi."],
    ["Elektr avtomobillarni qanday topaman?", "Katalogdagi “Elektr” bo‘limi orqali elektromobillarni ko‘rishingiz mumkin."],
    ["Buyurtmam holatini qanday tekshiraman?", "Hisobingizga kirib, “Buyurtmalarim” bo‘limidan buyurtma va kredit arizasi holatini kuzatishingiz mumkin."],
    ["Kredit olish kafolatlanadimi?", "Yo‘q. Kredit berish bo‘yicha yakuniy qarorni tanlangan bank yoki moliya tashkiloti qabul qiladi."],
  ];
  return <><Header/><main className="mx-auto max-w-4xl px-5 py-12"><h1 className="text-3xl font-black text-slate-950">{ru ? "Часто задаваемые вопросы" : "Tez-tez so‘raladigan savollar"}</h1><p className="mt-3 text-slate-600">{ru ? "Ответы о новых автомобилях, ценах, автокредите и заказах." : "Yangi avtomobillar, narxlar, avtokredit va buyurtmalar haqida muhim javoblar."}</p><div className="mt-8 space-y-4">{items.map(([q,a])=><details key={q} className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-950">{q}</summary><p className="mt-3 leading-7 text-slate-600">{a}</p></details>)}</div></main><Footer/></>;
}
