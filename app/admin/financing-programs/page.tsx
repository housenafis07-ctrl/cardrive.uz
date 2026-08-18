import { AdminTable, Field } from "@/components/admin-ui";
import { createServiceRoleClient } from "@/supabase/server";
import { createFinancingProgramAction } from "@/app/admin/financing-actions";

export default async function FinancingProgramsPage() {
  const c = createServiceRoleClient();
  const [programs, banks, dealers, cars] = await Promise.all([
    c.from("financing_programs").select("id,bank_id,name,type,interest_rate,down_payment_percent,term_months,insurance_amount,insurance_percent,is_active").order("sort_order").order("name"),
    c.from("banks").select("id,name").eq("is_active", true).order("name"),
    c.from("dealers").select("id,name").eq("is_active", true).order("name"),
    c.from("cars").select("id,name,price").eq("is_active", true).order("name"),
  ]);
  const bankMap = new Map((banks.data ?? []).map(b => [b.id, b.name]));
  return <div>
    <h1 className="text-3xl font-black">Kredit va bo‘lib to‘lash</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-500">Bank krediti va dilerning o‘z hisobidan bo‘lib to‘lash dasturlarini shu yerdan boshqaring. Mijozga faqat faol dasturlar ko‘rsatiladi.</p>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_480px]">
      <AdminTable><thead className="border-b bg-slate-50"><tr><th className="p-3">Bank/Diler</th><th className="p-3">Dastur</th><th className="p-3">Turi</th><th className="p-3">Avans</th><th className="p-3">Foiz</th><th className="p-3">Muddat</th><th className="p-3">Sug‘urta</th></tr></thead><tbody>{(programs.data ?? []).map(x => <tr key={x.id} className="border-b"><td className="p-3">{x.bank_id ? bankMap.get(x.bank_id) ?? "—" : "Diler hisobidan"}</td><td className="p-3 font-semibold">{x.name}</td><td className="p-3">{x.type === "credit" ? "Kredit" : "Rassrochka"}</td><td className="p-3">{x.down_payment_percent ?? 0}%</td><td className="p-3">{x.interest_rate ?? 0}%</td><td className="p-3">{x.term_months ?? "—"} oy</td><td className="p-3">{x.insurance_amount ? `${Number(x.insurance_amount).toLocaleString()} UZS` : x.insurance_percent != null ? `${Number(x.insurance_percent).toLocaleString()}%` : "—"}</td></tr>)}</tbody></AdminTable>
      <form action={createFinancingProgramAction} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Yangi dastur</h2>
        <label className="block text-sm font-semibold">Turi<select name="financingType" className="mt-1 w-full rounded border p-2"><option value="credit">Bank krediti</option><option value="installment">Diler hisobidan rassrochka</option></select></label>
        <label className="block text-sm font-semibold">Bank (faqat kredit uchun)<select name="bankId" className="mt-1 w-full rounded border p-2"><option value="">Dilersiz / tanlanmagan</option>{(banks.data ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <Field name="name" label="Dastur nomi" required/><Field name="nameUz" label="Nomi UZ"/><Field name="nameRu" label="Nomi RU"/>
        <div className="grid gap-3 sm:grid-cols-2"><Field name="minDownPaymentPercent" label="Boshlang‘ich to‘lov %" type="number"/><Field name="annualInterestRate" label="Yillik foiz %" type="number"/><Field name="minTermMonths" label="Min. muddat, oy" type="number" step="1"/><Field name="maxTermMonths" label="Max. muddat, oy" type="number" step="1"/><Field name="maxFinancingPercent" label="Max. moliyalashtirish %" type="number"/><Field name="commissionPercent" label="Komissiya %" type="number"/></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="font-black">Sug‘urta</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field name="insuranceType" label="Turi (KASKO va h.k.)"/><Field name="insuranceAmount" label="Summa, UZS" type="number"/><Field name="insurancePercent" label="Foiz %" type="number"/></div></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="font-black">Imtiyozlar</p><div className="mt-3 space-y-3"><label className="block text-sm font-semibold">UZ<textarea name="benefitsUz" className="mt-1 w-full rounded border p-3" placeholder="Masalan: KASKO bepul; komissiya 0%; subsidiya..."/></label><label className="block text-sm font-semibold">RU<textarea name="benefitsRu" className="mt-1 w-full rounded border p-3"/></label></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field name="minCarPrice" label="Min. avtomobil narxi" type="number"/><Field name="maxCarPrice" label="Max. avtomobil narxi" type="number"/><Field name="minAmount" label="Min. kredit summasi" type="number"/><Field name="maxAmount" label="Max. kredit summasi" type="number"/></div>
        <label className="block text-sm font-semibold">Dilerlar<select name="dealerIds" multiple className="mt-1 h-28 w-full rounded border p-2">{(dealers.data ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Aniq avtomobillar<select name="carIds" multiple className="mt-1 h-28 w-full rounded border p-2">{(cars.data ?? []).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Izoh<textarea name="description" className="mt-1 w-full rounded border p-3"/></label><label className="block text-sm font-semibold">Talablar<textarea name="eligibilityNotes" className="mt-1 w-full rounded border p-3"/></label>
        <div className="grid gap-3 sm:grid-cols-2"><Field name="sourceLabel" label="Manba nomi"/><Field name="sourceUrl" label="Manba URL"/></div><label className="flex gap-2"><input type="checkbox" name="isActive" defaultChecked/>Faol</label><button className="w-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button>
      </form>
    </div>
  </div>;
}
