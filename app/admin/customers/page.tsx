import { AdminTable } from "@/components/admin-ui";
import { createServiceRoleClient } from "@/supabase/server";

type CustomerOrder = {
  customer_id: string;
  car_id: string | null;
  created_at: string;
  total_amount: number | null;
  status: string;
  cars: { name?: string | null; name_uz?: string | null; name_ru?: string | null } | { name?: string | null; name_uz?: string | null; name_ru?: string | null }[] | null;
};

export default async function AdminCustomersPage() {
  const db = createServiceRoleClient();
  const { data: customers } = await db.from("profiles").select("id,full_name,phone,created_at,is_active").eq("role", "customer").order("created_at", { ascending: false });
  const ids = (customers ?? []).map((c) => c.id);
  const { data: rawOrders } = ids.length
    ? await db.from("orders").select("customer_id,car_id,created_at,total_amount,status,cars(name,name_uz,name_ru)").in("customer_id", ids).order("created_at", { ascending: false })
    : { data: [] };
  const orders = (rawOrders ?? []) as unknown as CustomerOrder[];
  const latest = new Map<string, CustomerOrder>();
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.customer_id, (counts.get(order.customer_id) ?? 0) + 1);
    if (!latest.has(order.customer_id)) latest.set(order.customer_id, order);
  }
  return <div>
    <p className="text-sm font-bold text-amber-600">CRM</p>
    <h1 className="mt-1 text-3xl font-black">Mijozlar</h1>
    <p className="mt-2 text-sm text-slate-500">Mijozlar, buyurtmalar soni va oxirgi avtomobil bo‘yicha umumiy ko‘rinish.</p>
    <div className="mt-6"><AdminTable><thead><tr><th className="p-3">Mijoz</th><th className="p-3">Telefon</th><th className="p-3">Buyurtmalar</th><th className="p-3">Oxirgi avtomobil</th><th className="p-3">Oxirgi buyurtma</th><th className="p-3">Holat</th></tr></thead><tbody>{(customers ?? []).map((c) => { const o = latest.get(c.id); const car = Array.isArray(o?.cars) ? o?.cars[0] : o?.cars; return <tr key={c.id} className="border-b"><td className="p-3 font-semibold">{c.full_name || "—"}</td><td className="p-3">{c.phone || "—"}</td><td className="p-3">{counts.get(c.id) ?? 0}</td><td className="p-3">{car?.name_uz || car?.name_ru || car?.name || "—"}</td><td className="p-3">{o ? new Date(o.created_at).toLocaleDateString("uz-UZ") : "—"}</td><td className="p-3">{c.is_active ? "Faol" : "Faol emas"}</td></tr>; })}</tbody></AdminTable></div>
  </div>;
}
