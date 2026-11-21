import { createServiceRoleClient } from "@/supabase/server";
import { syncCbuExchangeRateAction } from "@/app/admin/exchange-rates/actions";

type Params = { success?: string; error?: string; rate?: string; date?: string };
const money = (value: number) => new Intl.NumberFormat("uz-UZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export const metadata = { title: "Valyuta kurslari | Cardrive Admin" };

export default async function AdminExchangeRatesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const client = createServiceRoleClient();
  const { data: rows, error } = await client
    .from("exchange_rates")
    .select("id,currency_code,rate,rate_date,source,fetched_at,is_current")
    .eq("currency_code", "USD")
    .order("rate_date", { ascending: false })
    .limit(30);
  const current = (rows ?? []).find(row => row.is_current) ?? rows?.[0] ?? null;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Moliya sozlamalari</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Valyuta kurslari</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">USD/UZS kursi Markaziy bankning CBU.uz rasmiy API manbasidan avtomatik olinadi. Kurs tarixi shu yerda saqlanadi.</p>
    </div>

    {params.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Kurs yangilandi: 1 USD = {money(Number(params.rate))} UZS · Sana: {params.date}</div>}
    {params.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{params.error}</div>}
    {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Kurslar jadvalini o‘qib bo‘lmadi. Migratsiya hali qo‘llanmagan bo‘lishi mumkin: {error.message}</div>}

    <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-500">Amaldagi rasmiy kurs</p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{current ? "Faol" : "Kurs yo‘q"}</span>
        </div>
        <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{current ? money(Number(current.rate)) : "—"} <span className="text-base font-bold text-slate-400">UZS</span></p>
        <p className="mt-2 text-sm text-slate-500">1 AQSH dollari uchun</p>
        <div className="mt-6 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-slate-400">Kurs sanasi</p><p className="mt-1 font-bold">{current?.rate_date ?? "Ma’lumot yo‘q"}</p></div>
          <div><p className="text-xs text-slate-400">Bazaga olingan vaqt</p><p className="mt-1 font-bold">{current ? new Date(current.fetched_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" }) : "Ma’lumot yo‘q"}</p></div>
          <div><p className="text-xs text-slate-400">Manba</p><p className="mt-1 font-bold">{current?.source ?? "CBU.uz"}</p></div>
          <div><p className="text-xs text-slate-400">Yangilanish jadvali</p><p className="mt-1 font-bold">Har kuni · 09:00 (Toshkent)</p></div>
        </div>
        <form action={syncCbuExchangeRateAction} className="mt-6">
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">↻ Hozir yangilash</button>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-sm font-bold text-emerald-300">Avtomatik sinxronlash</p>
        <h2 className="mt-3 text-2xl font-black">CBU.uz → Cardrive</h2>
        <ul className="mt-5 space-y-3 text-sm text-slate-300">
          <li>• Har kuni 09:00 da CBU API tekshiriladi.</li>
          <li>• Kurs va rasmiy sana Supabase tarixiga yoziladi.</li>
          <li>• Dam olish kunlari CBU oxirgi e’lon qilgan kurs saqlanadi.</li>
          <li>• API ishlamasa, avvalgi muvaffaqiyatli kurs o‘chirilmaydi.</li>
          <li>• Avtomobil va kredit kalkulyatorlari eng so‘nggi saqlangan kursdan foydalanadi.</li>
        </ul>
        <p className="mt-6 rounded-xl bg-white/10 p-3 text-xs leading-5 text-slate-300">Eslatma: CBU rasmiy kursi bankning sotish yoki kredit shartnomasida qo‘llaydigan konvertatsiya kursidan farq qilishi mumkin.</p>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b p-5"><h2 className="font-black">Kurslar tarixi</h2><p className="mt-1 text-sm text-slate-500">Oxirgi 30 ta saqlangan USD kursi</p></div>
      {rows?.length ? <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Sana</th><th className="px-5 py-3">Valyuta</th><th className="px-5 py-3">Kurs</th><th className="px-5 py-3">Manba</th><th className="px-5 py-3">Holat</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="px-5 py-3 font-semibold">{row.rate_date}</td><td className="px-5 py-3">{row.currency_code}</td><td className="px-5 py-3 font-bold tabular-nums">{money(Number(row.rate))} so‘m</td><td className="px-5 py-3 text-slate-500">{row.source}</td><td className="px-5 py-3">{row.is_current ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Amaldagi</span> : <span className="text-xs text-slate-400">Tarix</span>}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">Hozircha kurs tarixi mavjud emas. Migratsiya qo‘llangach, “Hozir yangilash” tugmasi orqali birinchi kursni saqlang.</p>}
    </section>
  </div>;
}
