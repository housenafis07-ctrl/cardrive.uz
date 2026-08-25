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

export function JivoAdviceButton({ carName, brandName, priceText, pageUrl, financing }: Props) {
  const openAdvice = () => {
    const run = () => {
      const api = window.jivo_api;
      if (!api) return false;

      const financingText = financing.length
        ? financing
            .slice(0, 6)
            .map((item) => {
              const rate = item.interest !== null ? `${item.interest}%` : "individual";
              const term = item.maxTerm ? `${item.maxTerm} oy` : "mavjud shartlar bo‘yicha";
              const down = item.minDown !== null ? `${item.minDown}% dan` : "mavjud shartlar bo‘yicha";
              return `${item.bankName} — ${item.programName} — ${rate} — ${term} — avans ${down}`;
            })
            .join("\n")
        : "Hozircha kredit/rassrochka ma’lumotlari mavjud emas.";

      api.sendPageTitle(`${brandName} ${carName} — Cardrive.uz`, true, pageUrl);
      api.setCustomData([
        { title: "🚗 Avtomobil", key: "Model", content: `${brandName} ${carName}` },
        { title: "💰 Narx", key: "Narxi", content: priceText },
        { title: "💳 Moliyalashtirish", key: "Variantlar", content: financingText },
        { title: "🔗 Sahifa", content: "Avtomobil sahifasini ochish", link: pageUrl },
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
      Maslahat olish
    </button>
  );
}
