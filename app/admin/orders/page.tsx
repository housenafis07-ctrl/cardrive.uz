import { AdminOrderService } from "@/services/admin-order-service";
import { AdminOrdersTable } from "@/components/admin-orders-table";
import { createServiceRoleClient } from "@/supabase/server";

export default async function AdminOrdersPage({searchParams}:{searchParams:Promise<{status?:string;purchaseType?:string;carId?:string;dateFrom?:string;dateTo?:string;needsAttention?:string}>}){
  const p=await searchParams;
  const db=createServiceRoleClient();
  const {data:cars}=await db.from("cars").select("id,name,name_uz,name_ru").order("name_uz",{ascending:true});
  const result=await new AdminOrderService().listOrders({status:p.status,purchaseType:p.purchaseType,carId:p.carId,dateFrom:p.dateFrom,dateTo:p.dateTo,needsAttention:p.needsAttention==="true"});
  return <div>
    <h1 className="text-3xl font-black">Buyurtmalar</h1>
    <p className="mt-2 text-sm text-slate-500">CRM: buyurtmalarni holat, to‘lov turi, avtomobil va sana bo‘yicha boshqaring.</p>
    <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <select name="status" defaultValue={p.status??""} className="rounded-lg border p-2"><option value="">Barchasi</option><option value="pending">Kutilmoqda</option><option value="confirmed">Tasdiqlandi</option><option value="processing">Jarayonda</option><option value="completed">Bajarildi</option><option value="cancelled">Bekor qilindi</option></select>
      <select name="purchaseType" defaultValue={p.purchaseType??""} className="rounded-lg border p-2"><option value="">To‘lov turi</option><option value="cash">Naqd pul</option><option value="online">Onlayn</option><option value="credit">Kredit</option><option value="installment">Bo‘lib to‘lash</option></select>
      <select name="carId" defaultValue={p.carId??""} className="rounded-lg border p-2"><option value="">Avtomobil</option>{(cars??[]).map(c=><option key={c.id} value={c.id}>{c.name_uz||c.name_ru||c.name}</option>)}</select>
      <label className="text-sm">Dan<input type="date" name="dateFrom" defaultValue={p.dateFrom??""} className="ml-2 rounded-lg border p-2"/></label>
      <label className="text-sm">Gacha<input type="date" name="dateTo" defaultValue={p.dateTo??""} className="ml-2 rounded-lg border p-2"/></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="needsAttention" value="true" defaultChecked={p.needsAttention==="true"}/>Diqqat talab qiladi</label>
      <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filtrlash</button>
    </form>
    <div className="mt-6"><AdminOrdersTable orders={result.data??[]}/></div>
  </div>
}
