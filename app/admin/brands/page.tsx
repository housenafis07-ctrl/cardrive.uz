import Link from "next/link";
import { AdminTable, Field } from "@/components/admin-ui";
import { createBrandAction, deactivateAction } from "@/app/admin/actions";
import { AdminCatalogService } from "@/services/admin-catalog-service";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  const p = await searchParams;
  const result = await new AdminCatalogService().brands(p.q ?? "", Number(p.page ?? 1));

  return (
    <div>
      <h1 className="text-3xl font-black">Brendlar</h1>
      {p.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{p.error}</div> : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          <form className="mb-4 flex gap-2">
            <input name="q" defaultValue={p.q} placeholder="Brend qidirish" className="w-full rounded-lg border px-3 py-2" />
            <button className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white">Qidirish</button>
          </form>
          {result.data?.length ? (
            <AdminTable>
              <thead className="border-b bg-slate-50 text-slate-500"><tr><th className="p-3">Nomi</th><th className="p-3">Slug</th><th className="p-3">Holat</th><th className="p-3" /></tr></thead>
              <tbody>
                {result.data.map((brand) => (
                  <tr key={brand.id} className="border-b last:border-0"><td className="p-3 font-semibold">{brand.name}</td><td className="p-3 text-slate-600">{brand.slug}</td><td className="p-3">{brand.is_active ? "Faol" : "Nofaol"}</td><td className="p-3"><form action={deactivateAction}><input type="hidden" name="kind" value="brands" /><input type="hidden" name="id" value={brand.id} /><div className="flex gap-3"><Link className="text-sm font-bold text-slate-900 underline" href={`/admin/brands/${brand.id}/edit`}>Tahrirlash</Link><button className="text-sm font-bold text-red-700">Faolsizlantirish</button></div></form></td></tr>
                ))}
              </tbody>
            </AdminTable>
          ) : <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Brendlar hali mavjud emas.</p>}
        </section>
        <form action={createBrandAction} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Yangi brend</h2>
          <Field name="name" label="Nomi" required />
          <p className="text-xs text-slate-500">Slug brend nomidan avtomatik yaratiladi.</p>
          <Field name="logoUrl" label="Logo URL" />
          <label className="block text-sm font-semibold">Tavsif<textarea name="description" className="mt-1 w-full rounded-lg border p-3" /></label>
          <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isActive" defaultChecked />Faol</label>
          <button className="w-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button>
        </form>
      </div>
    </div>
  );
}
