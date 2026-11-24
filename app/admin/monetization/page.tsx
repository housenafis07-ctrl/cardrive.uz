import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
import { updateMonetizationProductAction } from "./actions";
export const dynamic="force-dynamic";
type ProductRow = {
 id: string; code: string; title_uz: string; title_ru: string;
 product_type: string; duration_days: number | null;
 amount: number | string | null; currency: string; is_active: boolean;
};
type OrderRow = {
 id: string; status: string; total_amount: number | string;
 currency: string; created_at: string; customer_profile_id: string;
};
export default async function AdminMonetizationPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}) {
 await requireAdminUser(); const p=await searchParams; const db=createServiceRoleClient();
 const [{data:products,error},{data:orders}]=await Promise.all([
  db.from("monetization_products").select("id,code,title_uz,title_ru,product_type,duration_days,amount,currency,is_active").order("product_type").order("duration_days"),
  db.from("monetization_orders").select("id,status,total_amount,currency,created_at,customer_profile_id").order("created_at",{ascending:false}).limit(50)
 ]);
 return <main className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-cyan-700">AVTOBOZOR · REVENUE</p><h1 className="mt-1 text-2xl font-black">Monetizatsiya boshqaruvi</h1><p className="mt-1 text-sm text-slate-500">Mahsulotlar narxi, davomiyligi va faolligini boshqaring.</p></div><Link href="/admin" className="rounded-xl border px-4 py-2 text-xs font-bold">Admin panelga qaytish</Link></div>
  {p.saved?<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">O‘zgarishlar saqlandi.</p>:null}
  {p.error?<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{p.error}</p>:null}
  {error?<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Mahsulotlar jadvali topilmadi. Migratsiya hali bazaga qo‘llanmagan bo‘lishi mumkin.</p>:null}
  <section className="grid gap-3">{(products??[]).map((x:ProductRow)=><article key={x.id} className="rounded-2xl border bg-white p-4 shadow-sm">
   <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-black">{x.title_uz}</h2><p className="mt-1 text-xs text-slate-500">{x.code} · {x.product_type}{x.duration_days?" · "+x.duration_days+" kun":""}</p></div><span className="text-xs font-bold">{x.is_active?"Faol":"Nofaol"}</span></div>
   <form action={updateMonetizationProductAction} className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end"><input type="hidden" name="id" value={x.id}/>
    <label className="grid gap-1 text-xs font-semibold">Narx<input name="amount" type="number" min="0" step="0.01" defaultValue={x.amount??""} placeholder="Belgilanmagan" className="rounded-lg border px-3 py-2 text-sm"/></label>
    <label className="grid gap-1 text-xs font-semibold">Valyuta<select name="currency" defaultValue={x.currency} className="rounded-lg border px-3 py-2 text-sm"><option>UZS</option><option>USD</option></select></label>
    <label className="grid gap-1 text-xs font-semibold">Davomiylik (kun)<input name="duration_days" type="number" min="1" max="3650" defaultValue={x.duration_days??""} className="rounded-lg border px-3 py-2 text-sm"/></label>
    <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={x.is_active}/> Faol</label><button className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white">Saqlash</button></div>
   </form>
  </article>)}</section>
  <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-4"><h2 className="font-black">Oxirgi buyurtmalar</h2><p className="mt-1 text-xs text-slate-500">To‘lov provayderi ulanmaguncha buyurtmalar avtomatik faollashtirilmaydi.</p></div>{(orders??[]).length?<div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50"><tr><th className="p-3">Buyurtma</th><th className="p-3">Mijoz</th><th className="p-3">Summa</th><th className="p-3">Holat</th></tr></thead><tbody>{orders!.map((o:OrderRow)=><tr key={o.id} className="border-t"><td className="p-3 font-mono">{o.id.slice(0,8)}</td><td className="p-3 font-mono">{o.customer_profile_id.slice(0,8)}</td><td className="p-3 font-bold">{new Intl.NumberFormat("uz-UZ").format(Number(o.total_amount))} {o.currency}</td><td className="p-3">{o.status}</td></tr>)}</tbody></table></div>:<p className="p-5 text-sm text-slate-500">Hozircha buyurtmalar yo‘q.</p>}</section>
 </main>;
}