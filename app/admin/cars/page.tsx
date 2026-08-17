import Link from "next/link";
import { AdminTable, Field, SlugHint } from "@/components/admin-ui";
import { createCarAction, deactivateAction } from "@/app/admin/actions";
import { AdminCatalogService } from "@/services/admin-catalog-service";

export default async function CarsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  const p = await searchParams;
  const service = new AdminCatalogService();
  const [result, brands, models] = await Promise.all([service.cars(p.q ?? "", Number(p.page ?? 1)), service.brands("", 1), service.models("", 1)]);

  return (
    <div>
      <h1 className="text-3xl font-black">Avtomobillar</h1>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_420px]">
        <section>
          {result.data?.length ? (
            <AdminTable>
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-3">Avtomobil</th>
                  <th className="p-3">Narx</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((car) => (
                  <tr key={car.id} className="border-b last:border-0">
                    <td className="p-3">
                      <p className="font-semibold">{car.name}</p>
                      <p className="text-xs text-slate-500">
                        {car.brands?.name} · {car.car_models?.name}
                      </p>
                    </td>
                    <td className="p-3">
                      {car.price} {car.currency}
                    </td>
                    <td className="p-3">{car.stock_status}</td>
                    <td className="p-3">
                      <form action={deactivateAction}>
                        <input type="hidden" name="kind" value="cars" />
                        <input type="hidden" name="id" value={car.id} />
                        <div className="flex flex-wrap gap-3">
                          <Link className="text-sm font-bold text-slate-900 underline" href={`/admin/cars/${car.id}/edit`}>
                            Tahrirlash
                          </Link>
                          <Link className="text-sm font-bold text-slate-900 underline" href={`/admin/cars/${car.id}/images`}>
                            Rasmlar
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
            <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Avtomobillar hali mavjud emas.</p>
          )}
        </section>
        <section>
          {p.error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">Avtomobil saqlanmadi.</p>
              <p className="mt-1">{p.error}</p>
            </div>
          ) : null}
          <form action={createCarAction} className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2">
            <h2 className="col-span-full text-xl font-black">Yangi avtomobil</h2>
            <label className="text-sm font-semibold">
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
            <label className="text-sm font-semibold">
              Model
              <select name="modelId" required className="mt-1 w-full rounded-lg border p-2">
                <option value="">Tanlang</option>
                {models.data?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brands?.name ? `${model.brands.name} — ` : ""}{model.name}
                  </option>
                ))}
              </select>
            </label>
            <Field name="name" label="Nomi" required />
            <Field name="slug" label="Slug" />
            <div className="col-span-full">
              <SlugHint />
              <p className="mt-1 text-xs text-slate-500">Slug bo‘sh qoldirilsa, avtomobil nomidan avtomatik yaratiladi.</p>
            </div>
            <Field name="price" label="Narx" type="number" required />
            <Field name="oldPrice" label="Eski narx" type="number" />
            <Field name="currency" label="Valyuta" defaultValue="UZS" required />
            <Field name="year" label="Yili" type="number" required />
            <Field name="bodyType" label="Kuzov" />
            <Field name="fuelType" label="Yoqilg‘i" />
            <Field name="transmission" label="Transmissiya" />
            <Field name="driveType" label="Yuritma" />
            <Field name="engineVolume" label="Dvigatel hajmi" type="number" />
            <Field name="enginePower" label="Quvvat" type="number" />
            <Field name="rangeKm" label="Masofa (km)" type="number" />
            <Field name="seats" label="O‘rindiqlar" type="number" />
            <Field name="color" label="Rang" />
            <label className="col-span-full text-sm font-semibold">
              Tavsif
              <textarea name="description" className="mt-1 w-full rounded-lg border p-3" />
            </label>
            <label className="col-span-full text-sm font-semibold">
              Qisqa tavsif
              <textarea name="shortDescription" maxLength={500} className="mt-1 w-full rounded-lg border p-3" aria-describedby="short-description-help" />
              <p id="short-description-help" className="mt-1 text-xs font-normal text-slate-500">Maksimal 500 belgi. Limitdan oshsa saqlash bloklanadi.</p>
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
              <label className="flex gap-2">
                <input type="checkbox" name="isFeatured" />
                Tavsiya
              </label>
              <label className="flex gap-2">
                <input type="checkbox" name="isActive" defaultChecked />
                Faol
              </label>
            </div>
            <button className="col-span-full rounded-full bg-slate-950 py-3 font-bold text-white">Saqlash</button>
          </form>
        </section>
      </div>
    </div>
  );
}
