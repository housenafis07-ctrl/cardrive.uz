import {notFound} from "next/navigation";
import Link from "next/link";
import {requireAdminUser} from "@/lib/admin-auth";
import {AdminCreditApplicationService} from "@/services/admin-credit-application-service";
import {AdminCreditApplicationsTable} from "@/components/admin-credit-applications-table";
export const dynamic="force-dynamic";
export default async function AdminCreditApplicationsPage({searchParams}:{searchParams:Promise<{sort?:string}>}){
 const user=await requireAdminUser();if(user.role!=="admin")notFound();
 const p=await searchParams,sort=p.sort==="oldest"?"oldest":"newest";
 const result=await new AdminCreditApplicationService().listAll({sort});
 return <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">Yangi avtomobillar kredit arizalari</h1><p className="mt-1 text-sm text-slate-500">Ariza ma’lumotlari va mijoz hujjatlari · maxfiy bo‘lim</p></div><div className="flex gap-3 text-sm font-semibold"><Link href="/admin/credit-applications?sort=newest" className={sort==="newest"?"underline":"text-slate-500"}>Yangilari</Link><Link href="/admin/credit-applications?sort=oldest" className={sort==="oldest"?"underline":"text-slate-500"}>Eskilari</Link></div></div><div className="mt-6"><AdminCreditApplicationsTable applications={result.data??[]}/></div></div>;
}
