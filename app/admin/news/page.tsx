import { AdminCard, AdminTable } from "@/components/admin-ui";
import { moderateNewsArticleAction } from "@/app/admin/news/actions";
import { createServiceRoleClient } from "@/supabase/server";

export const metadata = { title: "Yangiliklar moderatsiyasi | Cardrive Admin" };

type Article = {
  id: string;
  source_name: string;
  source_url: string;
  title_original: string;
  title_uz: string;
  summary_uz: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
};

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const db = createServiceRoleClient();
  const [pending, published, rejected, sources, errors] = await Promise.all([
    db.from("news_articles").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
    db.from("news_articles").select("id", { count: "exact", head: true }).eq("moderation_status", "approved"),
    db.from("news_articles").select("id", { count: "exact", head: true }).eq("moderation_status", "rejected"),
    db.from("news_sources").select("id", { count: "exact", head: true }).eq("is_active", true),
    db.from("news_sources").select("id", { count: "exact", head: true }).eq("is_active", true).not("last_error", "is", null),
  ]);
  const { data, error } = await db.from("news_articles")
    .select("id,source_name,source_url,title_original,title_uz,summary_uz,image_url,published_at,created_at")
    .eq("moderation_status", "pending")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-sky-600">CARDRIVE NEWS</p>
        <h1 className="mt-2 text-3xl font-black">Yangiliklar moderatsiyasi</h1>
        <p className="mt-2 text-sm text-slate-500">RSS orqali kelgan materiallarni tekshiring. Tasdiqlangan maqolalargina saytda va yuqori lentada ko‘rinadi.</p>
      </div>
      {params.updated && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Maqola holati yangilandi.</p>}
      {(params.error || error) && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error || error?.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard label="Moderatsiyada" value={pending.count ?? 0} />
        <AdminCard label="E’lon qilingan" value={published.count ?? 0} />
        <AdminCard label="Rad etilgan" value={rejected.count ?? 0} />
        <AdminCard label="Faol RSS manbalari" value={sources.count ?? 0} />
      </div>
      <p className="text-xs text-slate-500">Xatolik qayd etgan faol manbalar: {errors.count ?? 0}. Manbalarni batafsil ko‘rish: <a className="font-bold text-sky-700 hover:underline" href="/admin/news-sources">RSS manbalari</a>.</p>
      <section className="space-y-3">
        <h2 className="font-black">Ko‘rib chiqilishi kerak bo‘lgan maqolalar ({data?.length ?? 0})</h2>
        {data?.length ? (
          <AdminTable>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-3">Maqola</th><th className="p-3">Manba / sana</th><th className="p-3">Qaror</th></tr>
            </thead>
            <tbody>
              {(data as Article[]).map((article) => (
                <tr key={article.id} className="border-t align-top">
                  <td className="max-w-3xl p-3">
                    <p className="font-bold">{article.title_uz}</p>
                    <p className="mt-1 text-xs text-slate-500">{article.title_original}</p>
                    {article.summary_uz && <p className="mt-2 text-sm text-slate-600">{article.summary_uz}</p>}
                    <a href={article.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-sky-700 hover:underline">Asl manbani ochish ↗</a>
                    {article.image_url && <a href={article.image_url} target="_blank" rel="noreferrer" className="ml-3 text-xs font-bold text-sky-700 hover:underline">Rasmni ochish ↗</a>}
                  </td>
                  <td className="whitespace-nowrap p-3 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">{article.source_name}</p>
                    <p className="mt-1">Chop etilgan: {article.published_at ? new Date(article.published_at).toLocaleString("uz-UZ") : "Sana yo‘q"}</p>
                    <p className="mt-1">Import: {new Date(article.created_at).toLocaleString("uz-UZ")}</p>
                  </td>
                  <td className="min-w-36 p-3">
                    <form action={moderateNewsArticleAction} className="space-y-2">
                      <input type="hidden" name="articleId" value={article.id} />
                      <button name="status" value="approved" className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Tasdiqlash</button>
                      <button name="status" value="rejected" className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Rad etish</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">Moderatsiya uchun yangi maqola yo‘q.</p>
        )}
      </section>
    </div>
  );
}
