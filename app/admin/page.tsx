import { AdminCard } from "@/components/admin-ui";
import { AdminCatalogService } from "@/services/admin-catalog-service";
import { AdminAnalyticsRepository } from "@/repositories/admin-analytics-repository";

const money = (n: number) => new Intl.NumberFormat("uz-UZ").format(n) + " so‘m";
const labels: Record<string, string> = { pending: "Yangi", confirmed: "Tasdiqlangan", processing: "Jarayonda", completed: "Yakunlangan", cancelled: "Bekor qilingan" };

export default async function AdminPage() {
  const [counts, analytics] = await Promise.all([new AdminCatalogService().counts(), new AdminAnalyticsRepository().dashboard()]);
  return <>
    <p className="text-sm font-bold text-amber-600">DASHBOARD</p>
    <h1 className="mt-1 text-3xl font-black">Boshqaruv paneli</h1>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <AdminCard label="Jami buyurtmalar" value={analytics.totalOrders}/>
      <AdminCard label="Bugungi buyurtmalar" value={analytics.todayOrders}/>
      <AdminCard label="Bu oygi buyurtmalar" value={analytics.monthOrders}/>
      <AdminCard label="Yangi buyurtmalar" value={analytics.newOrders}/>
      <AdminCard label="Tasdiqlangan" value={analytics.confirmedOrders}/>
      <AdminCard label="Bekor qilingan" value={analytics.cancelledOrders}/>
      <AdminCard label="Jami mijozlar" value={analytics.totalCustomers}/>
      <AdminCard label="Yangi mijozlar" value={analytics.newCustomers}/>
      <AdminCard label="Sotilgan avtomobillar" value={analytics.soldCars}/>
      <AdminCard label="Umumiy savdo" value={money(analytics.totalSales)}/>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Sotuv voronkasi</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(analytics.statusCounts).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span>{labels[key] ?? key}</span><b className="text-xl">{value}</b></div>)}</div></section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Top avtomobillar</h2><div className="mt-4 space-y-3">{analytics.topCars.length ? analytics.topCars.map((car, i) => <div key={car.id} className="flex items-center justify-between border-b pb-3"><span><b className="mr-2">{i + 1}.</b>{car.name}</span><span className="font-bold">{car.count} ta</span></div>) : <p className="text-slate-500">Hali yakunlangan sotuvlar yo‘q.</p>}</div></section>
    </div>
    <div className="mt-8"><h2 className="text-xl font-black">Katalog holati</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><AdminCard label="Brendlar" value={counts.brands}/><AdminCard label="Modellar" value={counts.models}/><AdminCard label="Avtomobillar" value={counts.cars}/><AdminCard label="Tavsiya etilganlar" value={counts.featured}/><AdminCard label="Mavjud" value={counts.available}/><AdminCard label="Tez orada" value={counts.comingSoon}/></div></div>
  </>;
}
