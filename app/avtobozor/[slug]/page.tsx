import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";
import { createPublicServerClient } from "@/supabase/public-server";
import { createServiceRoleClient } from "@/supabase/server";
import { FinancingService } from "@/services/financing-service";
import { UsedCarFinancingSection } from "@/components/used-car-financing-section";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const ru = locale === "ru";
  const db = createPublicServerClient();
  const { data: listing } = await db.from("used_car_listings")
    .select("slug,brand,model,year,description,condition_description,used_car_listing_images(public_url,sort_order,is_primary)")
    .eq("slug", slug).eq("status", "active").gt("expires_at", new Date().toISOString()).maybeSingle();

  if (!listing) return { title: ru ? "Объявление не найдено" : "E’lon topilmadi" };

  const images = [...(listing.used_car_listing_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const imageUrl = images[0]?.public_url;
  const title = `${listing.brand} ${listing.model} · ${listing.year}`;
  const rawDescription = listing.description?.trim() || listing.condition_description?.trim() ||
    (ru ? "Подробности и фотографии автомобиля на Cardrive.uz." : "Avtomobil rasmlari va batafsil ma’lumot Cardrive.uz’da.");
  const description = rawDescription.replace(/\\s+/g, " ").slice(0, 300);
  const url = `https://cardrive.uz/avtobozor/${listing.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Cardrive.uz",
      title,
      description,
      locale: ru ? "ru_RU" : "uz_UZ",
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function UsedCarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const ru = locale === "ru";
  const db = createPublicServerClient();
  const { data: listing } = await db.from("used_car_listings")
    .select("id,slug,brand,model,year,mileage_km,price,currency,region,district,body_type,fuel_type,transmission,engine_volume,color,vehicle_condition,condition_description,description,contact_name,contact_phone,seller_type,is_negotiable,created_at,used_car_listing_images(public_url,sort_order,is_primary)")
    .eq("slug", slug).eq("status", "active").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!listing) notFound();
  const financingResult = await new FinancingService().getBankCreditProgramsForUsedCar(Number(listing.price), listing.currency);
  const financingPrograms = financingResult.data ?? [];
  const images = [...(listing.used_car_listing_images ?? [])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order);

  // Only approved videos for an active public listing are exposed.
  // The bucket is private, so create short-lived signed playback URLs.
  const mediaDb = createServiceRoleClient();
  const { data: approvedMedia, error: mediaError } = await mediaDb
    .from("used_car_listing_media")
    .select("id,storage_path,original_name")
    .eq("listing_id", listing.id)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (mediaError) {
    console.error("[avtobozor-detail] approved video lookup failed", {
      code: mediaError.code,
      message: mediaError.message,
    });
  }

  const signedVideos = await Promise.all((approvedMedia ?? []).map(async (media) => {
    const signed = await mediaDb.storage
      .from("used-car-videos")
      .createSignedUrl(media.storage_path, 2 * 60 * 60);
    if (signed.error || !signed.data?.signedUrl) {
      console.error("[avtobozor-detail] video signed URL failed", {
        mediaId: media.id,
        message: signed.error?.message,
      });
      return null;
    }
    return { id: media.id, name: media.original_name, url: signed.data.signedUrl };
  }));
  const playableVideos = signedVideos.filter((video): video is NonNullable<typeof video> => video !== null);
  const fmt = new Intl.NumberFormat(ru?"ru-RU":"uz-UZ",{maximumFractionDigits:0}).format(Number(listing.price));
  const price = listing.currency === "USD" ? "$" + fmt : fmt + " so'm";
  const specs: Array<[string, string | null | undefined]> = [
    [ru?"Год выпуска":"Ishlab chiqarilgan yil",String(listing.year)],
    [ru?"Пробег":"Yurgan masofasi",Number(listing.mileage_km).toLocaleString() + " km"],
    [ru?"Регион":"Hudud",listing.region],
    [ru?"Район / город":"Tuman / shahar",listing.district],
    [ru?"Кузов":"Kuzov",listing.body_type],
    [ru?"Топливо":"Yoqilg'i",listing.fuel_type],
    [ru?"Коробка":"Uzatmalar qutisi",listing.transmission],
    [ru?"Объём двигателя":"Dvigatel hajmi",listing.engine_volume ? listing.engine_volume + " L" : null],
    [ru?"Цвет":"Rang",listing.color],
  ].filter((x):x is [string,string]=>Boolean(x[1]));
  return <><Header/><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <Link href="/avtobozor" className="text-sm font-semibold text-blue-700">← {ru?"Назад в авторынок":"Avtobozorga qaytish"}</Link>
    <div className="mt-5 grid gap-7 lg:grid-cols-[1.35fr_.85fr]">
      <section><div className="grid gap-3 sm:grid-cols-2">{images.length?images.map((image,i)=><div key={image.public_url} className={"overflow-hidden rounded-2xl bg-slate-100 " + (i===0?"sm:col-span-2":"")}><img src={image.public_url} alt={listing.brand+" "+listing.model} className={"w-full object-cover " + (i===0?"max-h-[520px] aspect-[16/10]":"aspect-[4/3]")}/></div>):<div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-slate-100 text-7xl">🚘</div>}</div>
        {playableVideos.length ? <section className="mt-8">
          <h2 className="text-xl font-black">{ru ? "Видео автомобиля" : "Avtomobil videolari"}</h2>
          <p className="mt-1 text-sm text-slate-500">{ru ? "Видео, проверенные модерацией Cardrive" : "Cardrive moderatsiyasidan o‘tgan videolar"}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {playableVideos.map((video) => <div key={video.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
              <video src={video.url} controls playsInline preload="metadata" className="aspect-video w-full" aria-label={video.name}>
                {ru ? "Ваш браузер не поддерживает воспроизведение видео." : "Brauzeringiz videoni ijro eta olmaydi."}
              </video>
              <p className="truncate bg-white px-3 py-2 text-xs text-slate-600">{video.name}</p>
            </div>)}
          </div>
        </section> : null}
                <h2 className="mt-8 text-xl font-black">{ru?"Характеристики":"Texnik xususiyatlari"}</h2><dl className="mt-3 grid grid-cols-2 gap-2">{specs.map(([k,v])=><div key={k} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-1 font-bold">{v}</dd></div>)}</dl>
        <h2 className="mt-8 text-xl font-black">{ru?"Состояние автомобиля":"Avtomobil holati"}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{listing.condition_description}</p><h2 className="mt-8 text-xl font-black">{ru?"Дополнительное описание":"Qo‘shimcha tavsif"}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>
      </section>
      <aside><div className="sticky top-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold text-slate-500">{ru?"Цена":"Narxi"}</p><p className="mt-1 text-3xl font-black text-blue-700">{price}</p>{listing.is_negotiable?<p className="mt-1 text-xs text-slate-500">{ru?"Возможен торг":"Savdolashish mumkin"}</p>:null}<h1 className="mt-5 text-2xl font-black">{listing.brand} {listing.model} · {listing.year}</h1><p className="mt-2 text-sm text-slate-500">{listing.region}{listing.district?", "+listing.district:""}</p><div className="mt-6 border-t pt-5"><p className="text-xs text-slate-500">{ru?"Продавец":"Sotuvchi"}</p><p className="mt-1 font-bold">{listing.contact_name}</p><p className="mt-1 text-xs text-slate-500">{listing.seller_type==="dealer"?(ru?"Автосалон":"Avtosalon"):(ru?"Частное лицо":"Jismoniy shaxs")}</p><a href={"tel:"+listing.contact_phone} className="mt-5 block rounded-full bg-blue-700 px-5 py-3 text-center font-bold text-white">{ru?"Позвонить продавцу":"Sotuvchiga qo‘ng‘iroq qilish"}</a><a href={"https://t.me/share/url?url="+encodeURIComponent("https://cardrive.uz/avtobozor/"+listing.slug)+"&text="+encodeURIComponent(listing.brand+" "+listing.model)} target="_blank" rel="noreferrer" className="mt-3 block rounded-full border px-5 py-3 text-center text-sm font-bold">{ru?"Поделиться объявлением":"E'lonni ulashish"}</a></div></div><p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">{ru?"Проверяйте документы, VIN и техническое состояние автомобиля до оплаты. Cardrive не является стороной сделки.":"To‘lovdan oldin hujjatlar, VIN va avtomobilning texnik holatini tekshiring. Cardrive oldi-sotdi bitimining tomoni emas."}</p></aside>
    </div>
  </main><Footer/></>;
}
