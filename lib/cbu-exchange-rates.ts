import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type CbuRate = { Ccy?: string; Rate?: string | number; Date?: string; Nominal?: string | number; Code?: string };

function parseCbuDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) throw new Error("CBU returned an invalid rate date");
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export async function syncCbuUsdRate() {
  const response = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`CBU API returned HTTP ${response.status}`);
  const rows = await response.json() as CbuRate[];
  const usd = rows.find(row => row.Ccy === "USD") ?? rows[0];
  const rate = Number(usd?.Rate);
  const nominal = Number(usd?.Nominal ?? 1);
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(nominal) || nominal <= 0) {
    throw new Error("CBU API response does not contain a valid USD rate");
  }
  const rateDate = parseCbuDate(usd?.Date);
  const client = createServiceRoleClient();

  const { error: clearError } = await client
    .from("exchange_rates")
    .update({ is_current: false })
    .eq("currency_code", "USD")
    .eq("is_current", true);
  if (clearError) throw new Error(`Could not clear previous current rate: ${clearError.message}`);

  const { data, error } = await client
    .from("exchange_rates")
    .upsert({
      currency_code: "USD",
      rate: rate / nominal,
      nominal: 1,
      rate_date: rateDate,
      source: "CBU.uz",
      fetched_at: new Date().toISOString(),
      is_current: true,
    }, { onConflict: "currency_code,rate_date" })
    .select("id,currency_code,rate,rate_date,source,fetched_at,is_current")
    .single();
  if (error) throw new Error(`Could not save CBU rate: ${error.message}`);

  return {
    currency: data.currency_code as string,
    rate: Number(data.rate),
    rateDate: data.rate_date as string,
    source: data.source as string,
    fetchedAt: data.fetched_at as string,
  };
}

export async function getLatestUsdUzsRate() {
  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("exchange_rates")
    .select("rate,rate_date,fetched_at")
    .eq("currency_code", "USD")
    .eq("is_current", true)
    .order("rate_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!error && data && Number(data.rate) > 0) {
    return { rate: Number(data.rate), rateDate: data.rate_date as string, fetchedAt: data.fetched_at as string, source: "CBU.uz" };
  }

  // Safe fallback for environments where the migration has not been applied yet.
  const response = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`CBU API returned HTTP ${response.status}`);
  const rows = await response.json() as CbuRate[];
  const usd = rows.find(row => row.Ccy === "USD") ?? rows[0];
  const rate = Number(usd?.Rate);
  const nominal = Number(usd?.Nominal ?? 1);
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(nominal) || nominal <= 0) throw new Error("No valid USD rate available");
  return { rate: rate / nominal, rateDate: parseCbuDate(usd?.Date), fetchedAt: new Date().toISOString(), source: "CBU.uz (live fallback)" };
}
