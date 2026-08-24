import type { Metadata } from "next";
import { Header, Footer } from "@/components/site-chrome";
import { CarGrid, EmptyState } from "@/components/catalog-ui";
import { FilterPanel, Pagination } from "@/components/catalog-controls";
import { catalogQuerySchema } from "@/features/catalog/catalog-query";
import { CatalogService } from "@/services/catalog-service";
import { getLocale, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Avtomobil sotib olish — yangi avtomobillar, avtokredit va rassrochka",
  description:
    "O‘zbekistonda avtomobil sotib olish: yangi Chevrolet, BYD, Kia va boshqa avtomobillar narxi, komplektatsiyasi, avtokredit, rassrochka va 0% moliyalashtirish takliflarini solishtiring.",
  keywords: [
    "avtomobil sotib olish", "avtomobil sotib olish onlayn", "yangi avtomobil sotib olish",
    "avtokredit", "eng arzon avtokredit", "avtokredit O‘zbekiston", "avtokredit kalkulyator",
    "avtomobil rassrochka", "rassrochka", "0% rassrochka", "foizsiz avtomobil",
    "avtomobillar narxi", "yangi avtomobillar", "Chevrolet narxi", "BYD narxi", "Kia narxi",
  ],
  alternates: { canonical: "/cars" },
};

type CarGridProps = Parameters<typeof CarGrid>[0];

export default async function CarsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = catalogQuerySchema.parse(raw);
  const locale = await getLocale();
  const x = t(locale);
  const service = new CatalogService();
  const [result, brands, bodies] = await Promise.all([service.getCars(raw), service.getActiveBrands(), service.getBodyTypes()]);
  const bodyTypes = [...new Set((bodies.data ?? []).map(item => item.body_type).filter((item): item is string => Boolean(item)))].sort();
  const cars = (result.data ?? []) as CarGridProps["cars"];

  return <><Header /><main className="mx-auto max-w-7xl px-5 py-10"><div className="mb-8"><p className="text-sm font-bold text-amber-600">{x.categories}</p><h1 className="mt-2 text-4xl font-black">O‘zbekistonda avtomobil sotib olish — yangi avtomobillar</h1><p className="mt-2 max-w-3xl text-slate-600">Avtomobillarni narxi, komplektatsiyasi va texnik xususiyatlari bo‘yicha tanlang. Avtokredit, rassrochka va mavjud moliyalashtirish imkoniyatlarini solishtiring.</p></div><div className="grid gap-8 lg:grid-cols-[280px_1fr]"><aside className="hidden lg:block"><FilterPanel query={query} brands={brands.data ?? []} bodyTypes={bodyTypes} /></aside><div><details className="mb-5 lg:hidden"><summary className="cursor-pointer rounded-xl border bg-white px-4 py-3 font-bold">{x.filters}</summary><div className="mt-3"><FilterPanel query={query} brands={brands.data ?? []} bodyTypes={bodyTypes} /></div></details><p className="mb-5 text-sm text-slate-600">{result.count ?? 0} {x.found}</p>{result.error ? <EmptyState title={locale === "ru" ? "Не удалось загрузить каталог. Попробуйте позже." : "Katalogni yuklab bo‘lmadi. Keyinroq urinib ko‘ring."} action={locale === "ru" ? "Обновить" : "Yangilash"} /> : result.data?.length ? <><CarGrid cars={cars} /><Pagination page={query.page} total={result.count ?? 0} /></> : <EmptyState title={query.q ? x.noSearch : x.noMatch} />}</div></div><section className="mt-16 rounded-3xl bg-slate-50 p-7"><h2 className="text-2xl font-black">Avtomobil sotib olish, avtokredit va rassrochka</h2><p className="mt-3 max-w-4xl leading-7 text-slate-600">Cardrive.uz orqali yangi avtomobillarni onlayn ko‘rib chiqing, narx va komplektatsiyalarni taqqoslang. Avtokredit, eng arzon kredit stavkalari, rassrochka va 0% takliflar mavjud bo‘lsa, ular avtomobil sahifalarida ko‘rsatiladi. Yakuniy kredit shartlari bank yoki moliyaviy hamkor tomonidan tasdiqlanadi.</p></section></main><Footer /></>;
}
