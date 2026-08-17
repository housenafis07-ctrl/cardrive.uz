import { AdminTable, Field } from "@/components/admin-ui";
import { createServiceRoleClient } from "@/supabase/server";
import { createDealerAction, deactivateDealerAction } from "@/app/admin/dealer-actions";

export default async function DealersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const p = await searchParams;
  const result = await createServiceRoleClient().from("dealers").select("id,name,region,phone,is_active,created_at").order("name");
  return <div>
    <h1 className="text-3xl font-black">Dilerlar</h1>
    {p.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{p.error}</div> : null}
    {p.success ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">Diler muvaffaqiyatli saqlandi.</div> : null}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
      <AdminTable><thead className="border-b bg-slate-50"><tr><th className="p-3">Diler</th><th className="p-3">Hudud</th><th className="p-3">Telefon</th><th className="p-3">Holat</th><th className="p-3" /></tr></thead><tbody>{(result.data ?? []).map((d) => <tr key={d.id} className="border-b"><td className="p-3 font-semibold">{d.name}</td><td className="p-3">{d.region ?? "—"}</td><td className="p-3">{d.phone ?? "—"}</td><td className="p-3">{d.is_active ? "Faol" : "Nofaol"}</td><td className="p-3">{d.is_active ? <form action={deactivateDealerAction}><input type="hidden" name="id" value={d.id}/><button className="text-sm font-bold text-red-700">Faolsizlantirish</button></form> : null}</td></tr>)}</tbody></AdminTable>
      <form action={createDealerAction} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-black">Yangi diler</h2><Field name="name" label="Nomi" required/><Field name="region" label="Hudud"/><Field name="phone" label="Telefon"/><label className="block text-sm font-semibold">Izoh<textarea name="description" className="mt-1 w-full rounded-lg border p-3"/></label><label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isActive" defaultChecked/>Faol</label><button className="w-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button></form>
    </div>
  </div>;
}
