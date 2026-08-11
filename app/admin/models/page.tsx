import Link from "next/link";
import { AdminTable, Field, SlugHint } from "@/components/admin-ui";
import { createModelAction, deactivateAction } from "@/app/admin/actions";
import { AdminCatalogService } from "@/services/admin-catalog-service";

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; page?: string }> }) {
  const p = await searchParams;
  const service = new AdminCatalogService();
  const [result, brands] = await Promise.all([service.models(p.q ?? "", Number(p.page ?? 1), p.brand), service.brands("", 1)]);

  return (
    <div>
      <h1 className="text-3xl font-black">Modellar</h1>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          {result.data?.length ? (
            <AdminTable>
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-3">Nomi</th>
                  <th className="p-3">Brend</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((model) => (
                  <tr key={model.id} className="border-b last:border-0">
                    <td className="p-3 font-semibold">{model.name}</td>
                    <td className="p-3">{model.brands?.name}</td>
                    <td className="p-3">{model.is_active ? "Faol" : "Nofaol"}</td>
                    <td className="p-3">
                      <form action={deactivateAction}>
                        <input type="hidden" name="kind" value="car_models" />
                        <input type="hidden" name="id" value={model.id} />
                        <div className="flex gap-3">
                          <Link className="text-sm font-bold text-slate-900 underline" href={`/admin/models/${model.id}/edit`}>
                            Tahrirlash
                          </Link>
                          <button className="text-sm font-bold text-red-700">Faolsizlantirish</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Modellar hali mavjud emas.</p>
          )}
        </section>
        <form action={createModelAction} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Yangi model</h2>
          <label className="block text-sm font-semibold">
            Brend
            <select name="brandId" required className="mt-1 w-full rounded-lg border p-2">
              <option value="">Tanlang</option>
              {brands.data?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <Field name="name" label="Nomi" required />
          <Field name="slug" label="Slug" required />
          <SlugHint />
          <label className="block text-sm font-semibold">
            Tavsif
            <textarea name="description" className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="flex gap-2 text-sm font-semibold">
            <input type="checkbox" name="isActive" defaultChecked />
            Faol
          </label>
          <button className="w-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button>
        </form>
      </div>
    </div>
  );
}
