import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/supabase/server";
import { newsSlug } from "@/lib/news-seo";
export const revalidate=900;
const base="https://cardrive.uz";
export async function GET(){
 const cutoff=new Date(Date.now()-48*60*60*1000).toISOString();
 const {data,error}=await createServiceRoleClient().from("news_articles").select("id,title_uz,published_at,image_url,source_name").eq("is_published",true).gte("published_at",cutoff).order("published_at",{ascending:false}).limit(1000);
 if(error)return new NextResponse("News sitemap temporarily unavailable",{status:503});
 const entries=(data??[]).map(a=>`<url><loc>${base}/news/${newsSlug(a.title_uz,a.id)}</loc><news:news><news:publication><news:name>Cardrive.uz</news:name><news:language>uz</news:language></news:publication><news:publication_date>${new Date(a.published_at??Date.now()).toISOString()}</news:publication_date><news:title>${xml(a.title_uz)}</news:title></news:news></url>`).join("");
 return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, s-maxage=900, stale-while-revalidate=3600"}});
}
function xml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
