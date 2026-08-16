import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { CarGrid, EmptyState } from "@/components/catalog-ui";
import { CatalogService } from "@/services/catalog-service";

export const metadata = { title: "Cardrive.uz | Yangi avtomobillar", description: "O‘zbekistondagi yangi avtomobillar katalogi." };

export default async function HomePage() {
  const service = new CatalogService();
  const [featured, available, brands] = await Promise.all([service.getFeaturedCars(), service.getAvailableCars(), service.getActiveBrands()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            <div>
              <p className="text-sm font-semibold text-amber-400">Yangi avtomobillar marketplace’i</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Yangi avtomobilingizni ishonch bilan tanlang.</h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">Brendlar, texnik xususiyatlar va shaffof narxlarni bir joyda solishtiring.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cars" className="rounded-full bg-amber-500 px-5 py-3 font-bold text-slate-950">Avtomobillarni ko‘rish</Link>
                <Link href="/cars?sort=featured" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Tavsiya etilganlar</Link>
              </div>
            </div>
            <div className="flex min-h-64 items-end rounded-3xl border border-slate-700 bg-[radial-gradient(circle_at_65%_30%,#475569,transparent_35%),linear-gradient(135deg,#1e293b,#0f172a)] p-7">
              <p className="max-w-xs text-sm text-slate-300">Katalog ma’lumotlari faqat mavjud avtomobil bazasidan ko‘rsatiladi.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex items-end justify-between">
            <div><p className="text-sm font-bold text-amber-600">TANLANGANLAR</p><h2 className="mt-2 text-3xl font-black">Tavsiya etilgan avtomobillar</h2></div>
            <Link href="/cars?sort=featured" className="text-sm font-bold underline">Barchasi</Link>
          </div>
          <div className="mt-7">{featured.data?.length ? <CarGrid cars={featured.data} /> : <EmptyState title="Hozircha tavsiya etilgan avtomobillar yo‘q" action="Katalogga o‘tish" />}</div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16">
            <h2 className="text-3xl font-black">Mavjud avtomobillar</h2>
            <div className="mt-7">{available.data?.length ? <CarGrid cars={available.data} /> : <EmptyState title="Hozircha mavjud avtomobillar yo‘q" />}</div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-amber-600">AVTOMOBIL BRENDLARI</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Brendlar</h2>
              </div>
              <Link href="/cars" className="text-sm font-bold text-blue-600 hover:underline">Barcha brendlar →</Link>
            </div>

            {brands.data?.length ? (
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {brands.data.map((brand) => (
                  <Link
                    key={brand.id}
                    href={"/cars?brand=" + brand.slug}
                    className="group flex min-h-28 items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-3">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="max-h-12 w-full object-contain transition group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-center text-xs font-black uppercase tracking-wide text-slate-600">{brand.name}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950">{brand.name}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {brand.model_count} ta model
                      </p>
                    </div>
                    <span className="ml-auto text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">→</span>
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="Hozircha faol brendlar yo‘q" />}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 pt-16">
          <div className="rounded-3xl bg-amber-500 p-8 sm:p-12"><h2 className="text-3xl font-black text-slate-950">O‘zingizga mos avtomobilni toping.</h2><Link href="/cars" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 font-bold text-white">Katalogni ochish</Link></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
