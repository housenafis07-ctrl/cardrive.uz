export type UsedCarCreditRule = {
  down_payment_percent: number;
  term_months: number;
  annual_interest_rate: number;
  is_available?: boolean;
};
export type UsedCarCreditProgram = {
  id: string;
  name?: string | null;
  name_uz?: string | null;
  name_ru?: string | null;
  currency?: string | null;
  calculator_price?: number | null;
  exchange_rate_to_uzs?: number | null;
  annual_interest_rate?: number | null;
  min_down_payment_percent?: number | null;
  max_term_months?: number | null;
  banks?: { name?: string | null; name_ru?: string | null } | null;
  financing_program_rules?: UsedCarCreditRule[] | null;
};
export type UsedCarBestCredit = {
  programId: string;
  providerName: string;
  programName: string;
  monthlyPayment: number;
  downPaymentPercent: number;
  termMonths: number;
  interestRate: number;
  currency: string;
};
function monthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.round(principal / months);
  return Math.round(principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
}
export function getBestUsedCarCredit(programs: UsedCarCreditProgram[], fallbackPrice: number, _fallbackCurrency: string, locale: "uz" | "ru" = "uz"): UsedCarBestCredit | null {
  const offers: Array<UsedCarBestCredit & { comparisonPaymentUzs: number }> = [];
  for (const program of programs) {
    const price = Number(program.calculator_price ?? fallbackPrice);
    if (!Number.isFinite(price) || price <= 0) continue;
    const currency = program.currency === "USD" ? "USD" : "UZS";
    const rules = (program.financing_program_rules ?? []).filter(rule => rule.is_available !== false);
    const candidates = rules.length ? rules : [{
      down_payment_percent: Number(program.min_down_payment_percent ?? 0),
      term_months: Number(program.max_term_months ?? 60),
      annual_interest_rate: Number(program.annual_interest_rate ?? 0),
      is_available: true,
    }];
    for (const rule of candidates) {
      const down = Number(rule.down_payment_percent);
      const term = Number(rule.term_months);
      const rate = Number(rule.annual_interest_rate);
      if (![down, term, rate].every(Number.isFinite) || down < 0 || down >= 100 || term <= 0 || rate < 0) continue;
      const payment = monthlyPayment(price * (1 - down / 100), rate, term);
      if (!payment) continue;
      const exchangeRate = Number(program.exchange_rate_to_uzs ?? 0);
      if (currency === "USD" && exchangeRate <= 0) continue;
      offers.push({
        programId: program.id,
        providerName: locale === "ru" ? program.banks?.name_ru ?? program.banks?.name ?? "Банк" : program.banks?.name ?? "Bank",
        programName: locale === "ru" ? program.name_ru ?? program.name ?? "Автокредит" : program.name_uz ?? program.name ?? "Avtokredit",
        monthlyPayment: payment,
        downPaymentPercent: down,
        termMonths: term,
        interestRate: rate,
        currency,
        comparisonPaymentUzs: currency === "USD" ? payment * exchangeRate : payment,
      });
    }
  }
  const best = offers.sort((a, b) => a.comparisonPaymentUzs - b.comparisonPaymentUzs || b.termMonths - a.termMonths || a.downPaymentPercent - b.downPaymentPercent)[0];
  if (!best) return null;
  const { comparisonPaymentUzs: _comparisonPaymentUzs, ...visible } = best;
  return visible;
}
