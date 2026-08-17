import { AdminTable } from "@/components/admin-ui";
import AdminBannerForm from "@/components/admin-banner-form";
import { createServiceRoleClient } from "@/supabase/server";
import { createBannerAction, deleteBannerAction, toggleBannerAction } from "@/app/admin/marketplace-actions";

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const p = await searchParams;
  const result = await createServiceRoleClient().from("home_banners").select("*").order("sort_order").order("created_at", { ascending: false });
  return <div>
    <h1 className="text-3xl font-black">Home bannerlar</h1>
    {p.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{p.error}</div> : null}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
      <section>
        {result.data?.length ? <AdminTable>
          <thead className="border-b bg-slate-50"><tr><th className="p-3">Banner</th><th className="p-3">Tartib</th><th className="p-3">Holat</th><th className="p-3">Amallar</th></tr></thead>
          <tbody>{result.data.map((banner) => <tr key={banner.id} className="border-b last:border-0">
            <td className="p-3"><div className="flex items-center gap-3"><img src={banner.image_url} alt={banner.title_uz || "Banner"} className="h-16 w-28 rounded-lg object-cover"/><div><p className="font-bold">{banner.title_uz}</p><p className="text-xs text-slate-500">{banner.title_ru}</p></div></div></td>
            <td className="p-3">{banner.sort_order}</td>
            <td className="p-3"><form action={toggleBannerAction}><input type="hidden" name="id" value={banner.id}/><input type="hidden" name="isActive" value={banner.is_active ? "" : "on"}/><button className="font-bold">{banner.is_active ? "Faol" : "Nofaol"}</button></form></td>
            <td className="p-3"><form action={deleteBannerAction} onSubmit={(e) => { if (!confirm("Bu bannerni o‘chirishni tasdiqlaysizmi?")) e.preventDefault(); }}><input type="hidden" name="id" value={banner.id}/><input type="hidden" name="imageUrl" value={banner.image_url}/><button className="font-bold text-red-600">O‘chirish</button></form></td>
          </tr>)}</tbody>
        </AdminTable> : <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Bannerlar hali qo‘shilmagan.</p>}
      </section>
      <AdminBannerForm action={createBannerAction} />
    </div>
  </div>;
}
