import Link from "next/link";
import { signOutAction } from "@/app/admin/sign-out-action";

const groups = [
  { title: "UMUMIY", links: [{ href: "/admin", label: "Dashboard", icon: "◫" }, { href: "/admin/customer-inquiries", label: "Mijozlar murojaatlari", icon: "✉" }] },
  { title: "YANGI AVTOMOBILLAR", links: [
    { href: "/admin/brands", label: "Brendlar", icon: "◈" },
    { href: "/admin/models", label: "Modellar", icon: "◇" },
    { href: "/admin/cars", label: "Avtomobillar katalogi", icon: "▣" },
    { href: "/admin/dealers", label: "Dilerlar", icon: "⌂" },
  ]},
  { title: "AVTOBOZOR · ISHLATILGAN", links: [
    { href: "/admin/used-listings", label: "E’lonlar moderatsiyasi", icon: "▤" },
    { href: "/admin/used-videos", label: "Video moderatsiyasi", icon: "▷" },
    { href: "/admin/used-car-credit-applications", label: "Avtobozor kredit arizalari", icon: "▧" },
  ]},
  { title: "SAVDO VA MOLIYA", links: [
    { href: "/admin/orders", label: "Buyurtmalar", icon: "⇄" },
    { href: "/admin/credit-applications", label: "Yangi avtomobil kredit arizalari", icon: "▧" },
    { href: "/admin/banks", label: "Banklar", icon: "⌑" },
    { href: "/admin/financing-programs", label: "Kredit dasturlari", icon: "◉" },
    { href: "/admin/exchange-rates", label: "Valyuta kurslari", icon: "＄" },
  ]},
  { title: "KONTENT VA SOZLAMALAR", links: [
    { href: "/admin/announcements", label: "Yangiliklar va e’lonlar", icon: "▱" },
    { href: "/admin/news", label: "Yangiliklar moderatsiyasi", icon: "▥" },
    { href: "/admin/news-sources", label: "Yangilik manbalari", icon: "⌁" },
    { href: "/admin/translations", label: "Tarjimalar", icon: "文" },
    { href: "/admin/categories", label: "Kategoriyalar", icon: "▦" },
    { href: "/admin/banners", label: "Bannerlar", icon: "▰" },
  ]},
];

export function AdminShell({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen bg-[#f4f7fb] text-slate-900 lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
    <aside className="relative z-20 border-b border-slate-800 bg-[#071326] text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">C</span>
          <span><span className="block text-sm font-black tracking-[.14em]">CARDRIVE</span><span className="mt-0.5 block text-[10px] font-bold tracking-[.24em] text-cyan-300">CONTROL CENTER</span></span>
        </Link>
        <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold tracking-wider text-emerald-300 lg:inline-flex">LIVE</span>
      </div>
      <nav className="flex gap-3 overflow-x-auto px-3 py-3 lg:block lg:space-y-5 lg:overflow-visible lg:px-3 lg:py-5">
        {groups.map(group=><section key={group.title} className="shrink-0 lg:space-y-1">
          <p className="hidden px-3 pb-2 text-[9px] font-extrabold tracking-[.2em] text-slate-500 lg:block">{group.title}</p>
          <div className="flex gap-1 lg:block">{group.links.map(link=><Link key={link.href} href={link.href} className={`group flex min-h-10 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white ${link.href==="/admin"?"bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20":""}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[.06] text-sm text-cyan-300 transition group-hover:bg-cyan-300/15">{link.icon}</span><span>{link.label}</span>
          </Link>)}</div>
        </section>)}
      </nav>
      <div className="hidden border-t border-white/10 p-4 lg:block"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-3"><p className="text-[10px] font-bold tracking-wider text-slate-400">CARDRIVE SYSTEM</p><p className="mt-1 text-xs font-semibold text-white">Boshqaruv muhiti</p><p className="mt-1 text-[10px] text-slate-500">Marketplace · CRM · Finance</p></div></div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div><p className="text-[10px] font-bold tracking-[.18em] text-slate-400">CARDRIVE / ADMIN</p><p className="mt-1 text-sm font-bold text-slate-800">Boshqaruv markazi</p></div>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"/>Tizim faol</span><form action={signOutAction}><button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">Chiqish ↗</button></form></div>
      </header>
      <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 xl:p-8">{children}</main>
    </div>
  </div>;
}
export function AdminCard({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,.04)]"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight">{value}</p></div>}
export function AdminTable({children}:{children:React.ReactNode}){return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm">{children}</table></div>}
export function SlugHint(){return <p className="text-xs text-slate-500">Slug nomdan tavsiya etiladi; noyob bo‘lishi kerak.</p>}
export function Field({name,label,type="text",step,required=false,defaultValue}:{name:string;label:string;type?:string;step?:string|number;required?:boolean;defaultValue?:string|number}){return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} type={type} step={step} required={required} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>}
