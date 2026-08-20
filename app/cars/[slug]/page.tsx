import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { AvailabilityBadge, Price } from "@/components/catalog-ui";
import { CarColorGallery } from "@/components/car-color-gallery";
import { OrderFlow } from "@/components/order-flow";
import { formatPrice } from "@/lib/formatters";
import { CatalogService } from "@/services/catalog-service";
import { FinancingService } from "@/services/financing-service";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await new CatalogService().getCarBySlug(slug, false);
  const car = result.data;
  if (!car) return { title: "Avtomobil topilmadi | Cardrive.uz" };
  const brand = car.brands?.name ?? "";
  const model = car.car_models?.name ?? "";
  return { title: `${brand} ${model} — ${car.name} ${car.year} | Cardrive.uz`, description: car.short_description ?? `${brand} ${model} — ${car.name}, ${car.year}. ${formatPrice(car.price, car.currency)}.` };
}

export default async function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const x = t(locale);
  const catalog = new CatalogService();
  const result = await catalog.getCarBySlug(slug, false);
  if (!result.data) notFound();
  const car = result.data;
  const customer = await getCurrentCustomer();
  const [financingResult, variantsResult] = await Promise.all([new FinancingService().getApplicableProgramsForCar(car.id), catalog.getCarVariants(car.model_id)]);
  const financingPrograms = financingResult.data ?? [];
  const variants = variantsResult.data ?? [];
  const localizedCar = car as typeof car & { color_name_ru?: string | null; color_name_uz?: string | null };
  const brandName = car.brands?.name ?? "";
  const modelName = car.car_models?.name ?? "";
  const specs = [[x.body,car.body_type],[x.fuel,car.fuel_type],[x.transmission,car.transmission],[x.drive,car.drive_type],[x.engine,car.engine_volume?`${car.engine_volume} L`:null],[x.power,car.engine_power?`${car.engine_power} ${locale==="ru"?"л.с.":"ot kuchi"}`:null],[x.range,car.range_km?`${car.range_km} km`:null],[x.seats,car.seats],[x.color,locale==="ru"?localizedCar.color_name_ru??car.color:localizedCar.color_name_uz??car.color]];
  return <><Header/><main className="mx-auto max-w-7xl px-5 py-8"><Link href="/cars" className="text-sm font-bold underline">← {x.back}</Link><div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><section><CarColorGallery images={car.car_images??[]} carName={`${brandName} ${modelName} ${car.name}`} locale={locale}/></section><section className="lg:sticky lg:top-5 lg:h-fit"><div className="flex items-center gap-2">{car.brands?.logo_url?<img src={car.brands.logo_url} alt={brandName} className="h-6 w-6 object-contain"/>:<span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-500">{(car.brands?.name??"?").slice(0,2).toUpperCase()}</span>}<p className="text-sm font-bold uppercase tracking-wide text-slate-500">{brandName} · {modelName}</p></div><p className="mt-2 text-sm font-semibold text-slate-500">Modifikatsiya</p><h1 className="text-4xl font-black tracking-tight">{car.name}</h1><div className="mt-4 flex items-center gap-3"><AvailabilityBadge status={car.stock_status} locale={locale}/><span className="text-sm text-slate-600">{car.year}</span></div><div className="mt-6"><Price amount={car.price} currency={car.currency} locale={locale}/>{car.old_price&&<p className="mt-1 text-sm text-slate-500 line-through">{formatPrice(car.old_price,car.currency,locale)}</p>}</div>{variants.length>1&&<section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-black">Modifikatsiyalar</h2><span className="text-xs font-semibold text-slate-500">{variants.length} ta variant</span></div><div className="mt-3 space-y-2">{variants.map(variant=>{const selected=variant.id===car.id;return <Link key={variant.id} href={`/cars/${variant.slug}`} className={`block rounded-xl border p-3 transition ${selected?"border-slate-950 bg-white shadow-sm":"border-slate-200 bg-white/70 hover:border-slate-400"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{variant.name}</p><p className="mt-1 text-xs text-slate-500">{variant.year} · {stockLabelForVariant(variant.stock_status,locale)}</p></div><div className="shrink-0 text-right"><p className="font-black">{formatPrice(Number(variant.price),variant.currency,locale)}</p>{variant.old_price?<p className="text-xs text-slate-400 line-through">{formatPrice(Number(variant.old_price),variant.currency,locale)}</p>:null}</div></div></Link>})}</div></section>}<div className="mt-7 flex flex-col gap-3 sm:flex-row">{car.stock_status==="available"?<OrderFlow carId={car.id} carName={car.name} price={car.price} currency={car.currency} isAuthenticated={!!customer} financingPrograms={financingPrograms} locale={locale}/>:<button type="button" disabled className="rounded-full bg-slate-300 px-5 py-3 font-bold text-slate-600">{x.unavailable}</button>}<button type="button" className="rounded-full border border-slate-300 px-5 py-3 font-bold">{x.advice}</button></div></section></div>{car.description&&<section className="mt-12 max-w-3xl"><h2 className="text-2xl font-black">{x.description}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{car.description}</p></section>}<section className="mt-12"><h2 className="text-2xl font-black">{x.specs}</h2><dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">{specs.filter(([,value])=>value!==null&&value!==undefined&&value!=="").map(([label,value])=><div key={label} className="flex justify-between gap-4 bg-white p-4"><dt className="text-slate-500">{label}</dt><dd className="font-semibold">{String(value)}</dd></div>)}</dl></section></main><Footer/></>;
}
function stockLabelForVariant(status:string,locale:"uz"|"ru"){if(locale==="ru")return status==="available"?"В наличии":status==="coming_soon"?"Скоро":status;return status==="available"?"Mavjud":status==="coming_soon"?"Tez orada":status}
