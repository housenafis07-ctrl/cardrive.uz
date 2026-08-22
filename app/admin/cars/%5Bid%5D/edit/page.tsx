import { notFound } from "next/navigation";
import { Field } from "@/components/admin-ui";
import { CarSpecsFields } from "@/components/car-specs-fields";
import { updateCarAction } from "@/app/admin/refinement-actions";
import { AdminReadService } from "@/services/admin-read-service";
import { AdminCatalogService } from "@/services/admin-catalog-service";
import { createServiceRoleClient } from "@/supabase/server";

export default async function EditCar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = new AdminCatalogService();
  const result = await new AdminReadService().car(id);
  if (!result.data) notFound();
  const c = result.data as typeof result.data & { dealer_id?: string|null; engine_type?: string|null; battery_capacity_kwh?: number|null; acceleration_0_100_sec?: number|null; charging_time_minutes?: number|null };
  const [brands, models, dealers] = await Promise.all([service.brands("",1),service.models("",1,c.brand_id),createServiceRoleClient().from("dealers").select("id,name").eq("is_active",true).order("name")]);
  return <form action={updateCarAction} className="grid max-w-4xl gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
    <input type="hidden" name="id" value={c.id}/><h1 className="col-span-full text-2xl font-black">Avtomobilni tahrirlash</h1>
    <label className="text-sm font-semibold">Brend <span className="text-red-600">*</span><select name="brandId" required defaultValue={c.brand_id} className="mt-1 w-full rounded border p-2">{brands.data?.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label className="text-sm font-semibold">Model <span className="text-red-600">*</span><select name="modelId" required defaultValue={c.model_id} className="mt-1 w-full rounded border p-2">{models.data?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    <label className="text-sm font-semibold">Diler<select name="dealerId" defaultValue={c.dealer_id??""} className="mt-1 w-full rounded border p-2"><option value="">Belgilanmagan</option>{(dealers.data??[]).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <Field name="name" label="Nomi" required defaultValue={c.name}/><Field name="slug" label="Slug" required defaultValue={c.slug}/><Field name="price" label="Narx" type="number" required defaultValue={c.price}/><Field name="oldPrice" label="Eski narx" type="number" defaultValue={c.old_price??""}/><Field name="currency" label="Valyuta" required defaultValue={c.currency}/><Field name="year" label="Yili" type="number" required defaultValue={c.year}/><Field name="bodyType" label="Kuzov" required defaultValue={c.body_type??""}/>
    <CarSpecsFields initialFuelType={c.fuel_type} initialEngineType={c.engine_type} initialBatteryCapacityKwh={c.battery_capacity_kwh} initialAcceleration0100Sec={c.acceleration_0_100_sec} initialChargingTimeMinutes={c.charging_time_minutes} initialRangeKm={c.range_km} initialEngineVolume={c.engine_volume} initialEnginePower={c.engine_power} initialTransmission={c.transmission} initialDriveType={c.drive_type}/>
    <Field name="seats" label="O‘rindiqlar" type="number" defaultValue={c.seats??""}/><Field name="color" label="Rang" defaultValue={c.color??""}/>
    <label className="text-sm font-semibold">Holat<select name="stockStatus" defaultValue={c.stock_status} className="mt-1 w-full rounded border p-2"><option value="available">Mavjud</option><option value="coming_soon">Tez orada</option><option value="reserved">Band</option><option value="sold">Sotilgan</option></select></label>
    <div className="flex items-end gap-4 pb-2 text-sm font-semibold"><label className="flex gap-2"><input name="isFeatured" type="checkbox" defaultChecked={c.is_featured}/>Tavsiya</label><label className="flex gap-2"><input name="isActive" type="checkbox" defaultChecked={c.is_active}/>Faol</label></div>
    <label className="col-span-full text-sm font-semibold">Qisqa tavsif<textarea name="shortDescription" defaultValue={c.short_description??""} className="mt-1 w-full rounded border p-3"/></label><label className="col-span-full text-sm font-semibold">Tavsif<textarea name="description" defaultValue={c.description??""} className="mt-1 w-full rounded border p-3"/></label>
    <button className="col-span-full rounded-full bg-slate-950 py-3 font-bold text-white">O‘zgarishlarni saqlash</button>
  </form>;
}
