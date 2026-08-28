import Link from "next/link";
import { AdminTable } from "@/components/admin-ui";
import { createCarAction, setCarActiveAction } from "@/app/admin/actions";
import { AdminCatalogService } from "@/services/admin-catalog-service";
import { createServiceRoleClient } from "@/supabase/server";
import { CarSpecsFields } from "@/components/car-specs-fields";

const PAGE_SIZE = 20;

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  const p = await searchParams;
  const service = new AdminCatalogService();
  const requestedPage = Number(p.page ?? 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const [result, brands, models, dealers] = await Promise.all([
    service.cars(p.q ?? "", page),
    service.brands("", 1),
    service.models("", 1),
    createServiceRoleClient().from("dealers").select("id,name").eq("is_active", true).order("name"),
  ]);

  const total = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);
  const makePageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (p.q) params.set("q", p.q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return `/admin/cars${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-black">Avtomobillar va modifikatsiyalar</h1>

      <form method="get" className="mt-6 flex gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <input
          name="q"
          defaultValue={p.q ?? ""}
          placeholder="Brend, model yoki modifikatsiya bo‘yicha qidirish"
          className="min-w-0 flex-1 rounded-lg border p-2"
        />
        <button className="rounded-lg bg-slate-950 px-5 py-2 font-bold text-white">Qidirish</button>
        {p.q ? (
          <Link href="/admin/cars" className="rounded-lg border px-5 py-2 font-bold">
            Tozalash
          </Link>
        ) : null}
      </form>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_420px]">
        <section>
          {result.data?.length ? (
            <>
              <AdminTable>
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="p-3">Brend · Model · Modifikatsiya</th>
                    <th className="p-3">Narx</th>
                    <th className="p-3">Holat</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((car) => (
                    <tr key={car.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {car.brands?.name} · {car.car_models?.name}
                        </p>
                        <p className="mt-1 font-semibold">{car.name}</p>
                      </td>
                      <td className="p-3">
                        {car.price} {car.currency}
                      </td>
                      <td className="p-3">
                        {car.stock_status} · {car.is_active ? "Faol" : "Faol emas"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-3">
                          <Link className="text-sm font-bold text-slate-900 underline" href={`/admin/cars/${car.id}/edit`}>
                            Tahrirlash
                          </Link>
                          <Link className="text-sm font-bold text-slate-900 underline" href={`/admin/cars/${car.id}/images`}>
                            Rasmlar · ranglar
                          </Link>
                          <form action={setCarActiveAction}>
                            <input type="hidden" name="id" value={car.id} />
                            <input type="hidden" name="active" value={String(!car.is_active)} />
                            <button className="text-sm font-bold underline">
                              {car.is_active ? "Faolsizlantirish" : "Faollashtirish"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
                <p className="text-sm text-slate-600">
                  {from}–{to} / jami {total} ta avtomobil
                </p>
                {totalPages > 1 ? (
                  <nav aria-label="Avtomobillar sahifalari" className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link href={makePageHref(currentPage - 1)} className="rounded-lg border px-3 py-2 text-sm font-bold">
                        ← Oldingi
                      </Link>
                    ) : (
                      <span className="rounded-lg border px-3 py-2 text-sm font-bold text-slate-400">← Oldingi</span>
                    )}

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) =>
                      pageNumber === currentPage ? (
                        <span key={pageNumber} aria-current="page" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">
                          {pageNumber}
                        </span>
                      ) : (
                        <Link key={pageNumber} href={makePageHref(pageNumber)} className="rounded-lg border px-3 py-2 text-sm font-bold">
                          {pageNumber}
                        </Link>
                      ),
                    )}

                    {currentPage < totalPages ? (
                      <Link href={makePageHref(currentPage + 1)} className="rounded-lg border px-3 py-2 text-sm font-bold">
                        Keyingi →
                      </Link>
                    ) : (
                      <span className="rounded-lg border px-3 py-2 text-sm font-bold text-slate-400">Keyingi →</span>
                    )}
                  </nav>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Avtomobillar hali mavjud emas.</p>
              {total > 0 && page > totalPages ? (
                <div className="mt-4 text-center">
                  <Link href={makePageHref(totalPages)} className="font-bold underline">
                    Oxirgi sahifaga qaytish
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section>
          {p.error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">Modifikatsiya saqlanmadi.</p>
              <p className="mt-1">{p.error}</p>
            </div>
          ) : null}
          <form action={createCarAction} className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2">
            <h2 className="col-span-full text-xl font-black">Yangi modifikatsiya</h2>
            <label className="text-sm font-semibold">
              Brend <span className="text-red-600">*</span>
              <select name="brandId" required className="mt-1 w-full rounded-lg border p-2">
                <option value="">Tanlang</option>
                {brands.data?.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Model <span className="text-red-600">*</span>
              <select name="modelId" required className="mt-1 w-full rounded-lg border p-2">
                <option value="">Tanlang</option>
                {models.data?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brands?.name ? `${model.brands.name} — ` : ""}{model.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Diler
              <select name="dealerId" className="mt-1 w-full rounded-lg border p-2">
                <option value="">Belgilanmagan</option>
                {(dealers.data ?? []).map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>{dealer.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Modifikatsiya nomi <span className="text-red-600">*</span>
              <input name="name" required className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <div className="col-span-full rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Slug URL uchun avtomatik yaratiladi. Sizdan alohida kiritish talab qilinmaydi.
            </div>
            <label className="text-sm font-semibold">
              Narx <span className="text-red-600">*</span>
              <input name="price" type="number" required className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm font-semibold">
              Eski narx
              <input name="oldPrice" type="number" className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm font-semibold">
              Valyuta <span className="text-red-600">*</span>
              <input name="currency" defaultValue="UZS" required className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm font-semibold">
              Yili <span className="text-red-600">*</span>
              <input name="year" type="number" required className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm font-semibold">
              Kuzov <span className="text-red-600">*</span>
              <input name="bodyType" required className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <CarSpecsFields />
            <label className="text-sm font-semibold">
              O‘rindiqlar
              <input name="seats" type="number" className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-sm font-semibold">
              Rang
              <input name="color" className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="col-span-full text-sm font-semibold">
              Tavsif
              <textarea name="description" className="mt-1 w-full rounded-lg border p-3" />
            </label>
            <label className="col-span-full text-sm font-semibold">
              Qisqa tavsif
              <textarea name="shortDescription" maxLength={500} className="mt-1 w-full rounded-lg border p-3" />
            </label>
            <label className="text-sm font-semibold">
              Zaxira holati
              <select name="stockStatus" className="mt-1 w-full rounded-lg border p-2">
                <option value="available">Mavjud</option>
                <option value="coming_soon">Tez orada</option>
                <option value="reserved">Band</option>
                <option value="sold">Sotilgan</option>
              </select>
            </label>
            <div className="flex items-end gap-4 pb-2 text-sm font-semibold">
              <label className="flex gap-2"><input type="checkbox" name="isFeatured" />Tavsiya</label>
              <label className="flex gap-2"><input type="checkbox" name="isActive" defaultChecked />Faol</label>
            </div>
            <button className="col-span-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button>
          </form>
        </section>
      </div>
    </div>
  );
}
