import type { MetadataRoute } from "next";
import { createPublicServerClient } from "@/supabase/public-server";

const baseUrl = "https://cardrive.uz";
const BATCH_SIZE = 1000;
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createPublicServerClient();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cars`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/avtomobil-sotib-olish`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/avtokredit`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/avtokredit/kalkulyator`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/rassrochka`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  for (let from = 0; ; from += BATCH_SIZE) {
    const { data, error } = await client
      .from("cars")
      .select("slug, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, from + BATCH_SIZE - 1);
    if (error) throw new Error(`Failed to build sitemap: ${error.message}`);
    for (const car of data ?? []) {
      if (!car.slug) continue;
      urls.push({ url: `${baseUrl}/cars/${car.slug}`, lastModified: car.created_at ? new Date(car.created_at) : now, changeFrequency: "daily", priority: 0.8 });
    }
    if (!data || data.length < BATCH_SIZE) break;
  }
  return urls;
}
