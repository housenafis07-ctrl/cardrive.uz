"use client";

type FinancingSummary = {
  bankName: string;
  programName: string;
  interest: number | null;
  minDown: number | null;
  maxTerm: number | null;
};

type Props = {
  carName: string;
  brandName: string;
  priceText: string;
  pageUrl: string;
  financing: FinancingSummary[];
  locale?: "uz" | "ru";
};

declare global {
  interface Window {
    jivo_api?: {
      open: (params?: { start?: string }) => unknown;
      setCustomData: (fields: Array<Record<string, string>>) => unknown;
      sendPageTitle: (title: string, fromApi?: boolean, url?: string) => unknown;
    };
  }
}

export function JivoAdviceButton({ carName, brandName, priceText, pageUrl, financing, locale = "uz" }: Props) {
  const isRu = locale === "ru";
  const openAdvice = () => {
    const run = () => {
      const api = window.jivo_api;
      if (!api) return false;

      const financingText = financing.length
        ? financing
            .slice(0, 6)
            .map((item) => {
              const rate = item.interest !== null ? `${item.interest}%` : isRu ? "индивидуально" : "individual";
              const term = item.maxTerm ? `${item.maxTerm} ${isRu ? "мес." : "oy"}` : isRu ? "по доступным условиям" : "mavjud shartlar bo‘yicha";
              const down = item.minDown !== null ? `${item.minDown}% ${isRu ? "от" : "dan"}` : isRu ? "по доступным условиям" : "mavjud shartlar bo‘yicha";
              return `${item.bankName} — ${item.programName} — ${rate} — ${term} — ${isRu ? "первоначальный взнос" : "avans"} ${down}`;
            })
            .join("\n")
        : isRu ? "Информация о кредите/рассрочке пока недоступна." : "Hozircha kredit/rassrochka ma’lumotlari mavjud emas.";

      api.sendPageTitle(`${brandName} ${carName} — Cardrive.uz`, true, pageUrl);
      api.setCustomData([
        { title: "🚗 " + (isRu ? "Автомобиль" : "Avtomobil"), key: "Model", content: `${brandName} ${carName}` },
        { title: "💰 " + (isRu ? "Цена" : "Narx"), key: "Narxi", content: priceText },
        { title: "💳 " + (isRu ? "Финансирование" : "Moliyalashtirish"), key: "Variantlar", content: financingText },
        { title: "🔗 " + (isRu ? "Страница" : "Sahifa"), content: isRu ? "Открыть страницу автомобиля" : "Avtomobil sahifasini ochish", link: pageUrl },
      ]);
      api.open({ start: "chat" });
      return true;
    };

    if (run()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (run() || attempts >= 30) window.clearInterval(timer);
    }, 200);
  };

  return (
    <button
      type="button"
      onClick={openAdvice}
      className="self-start shrink-0 rounded-full border border-slate-300 px-5 py-3 font-bold transition hover:border-slate-950 hover:bg-slate-50"
    >
      {isRu ? "Получить консультацию" : "Maslahat olish"}
    </button>
  );
}
