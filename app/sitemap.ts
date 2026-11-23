import type { MetadataRoute } from "next";
import { createPublicServerClient } from "@/supabase/public-server";
import { createServiceRoleClient } from "@/supabase/server";
import { newsSlug } from "@/lib/news-seo";

const baseUrl = "https://cardrive.uz";
const BATCH_SIZE = 1000;
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createPublicServerClient();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cars`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/avtobozor`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/avtomobil-sotib-olish`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/avtokredit`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/avtokredit/kalkulyator`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/rassrochka`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
  ];

  for (let from = 0; ; from += BATCH_SIZE) {
    const { data, error } = await client
      .from("cars")
      .select("slug, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, from + BATCH_SIZE - 1);

    // Sitemap should remain build-safe even when the database is temporarily
    // unavailable (for example, CI uses placeholder Supabase credentials).
    // Static public URLs above are still returned in that case.
    if (error) break;

    for (const car of data ?? []) {
      if (!car.slug) continue;
      urls.push({
        url: `${baseUrl}/cars/${car.slug}`,
        lastModified: car.created_at ? new Date(car.created_at) : now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    if (!data || data.length < BATCH_SIZE) break;
  }

  for (let from = 0; ; from += BATCH_SIZE) {
    const { data, error } = await client.from("used_car_listings").select("slug, created_at").eq("status", "active").gt("expires_at", now.toISOString()).order("created_at", { ascending: false }).range(from, from + BATCH_SIZE - 1);
    if (error) break;
    for (const listing of data ?? []) {
      if (!listing.slug) continue;
      urls.push({ url: `${baseUrl}/avtobozor/${listing.slug}`, lastModified: listing.created_at ? new Date(listing.created_at) : now, changeFrequency: "daily", priority: 0.7 });
    }
    if (!data || data.length < BATCH_SIZE) break;
  }

  const { data: articles, error: newsError } = await createServiceRoleClient()
    .from("news_articles")
    .select("id,title_uz,created_at,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(5000);
  if (!newsError) {
    for (const article of articles ?? []) {
      urls.push({
        url: `${baseUrl}/news/${newsSlug(article.title_uz, article.id)}`,
        lastModified: article.published_at ? new Date(article.published_at) : article.created_at ? new Date(article.created_at) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return urls;
}
