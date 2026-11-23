import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createServiceRoleClient } from "@/supabase/server";
import { getLocale } from "@/lib/locale";
import { newsIdFromSlug, newsSlug } from "@/lib/news-seo";

type Article={id:string;source_url:string;source_name:string;title_uz:string;summary_uz:string|null;title_ru:string;summary_ru:string|null;title_en:string;summary_en:string|null;editorial_note_uz:string|null;editorial_note_ru:string|null;image_url:string|null;published_at:string|null;created_at:string};
const base="https://cardrive.uz";
async function getArticle(slug:string){const id=newsIdFromSlug(slug);if(!id)return null;const {data}=await createServiceRoleClient().from("news_articles").select("id,source_url,source_name,title_uz,summary_uz,title_ru,summary_ru,title_en,summary_en,editorial_note_uz,editorial_note_ru,image_url,published_at,created_at").eq("id",id).eq("is_published",true).maybeSingle();return data as Article|null;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const article=await getArticle(slug);if(!article)return {title:"Maqola topilmadi | Cardrive"};
 const locale=await getLocale();const ru=locale==="ru";const title=ru?article.title_ru:article.title_uz;const description=(ru?article.summary_ru:article.summary_uz)||title;const canonical=`/news/${newsSlug(article.title_uz,article.id)}`;
 return {title,description:description.slice(0,300),alternates:{canonical},openGraph:{type:"article",url:canonical,title,description:description.slice(0,300),images:article.image_url?[{url:article.image_url}]:[],publishedTime:article.published_at??article.created_at},twitter:{card:"summary_large_image",title,description:description.slice(0,200),images:article.image_url?[article.image_url]:[]}};
}
export default async function NewsArticlePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const article=await getArticle(slug);if(!article)notFound();
 const locale=await getLocale();const ru=locale==="ru";const title=ru?article.title_ru:article.title_uz;const summary=(ru?article.summary_ru:article.summary_uz)||"";const note=ru?(article.editorial_note_ru||article.editorial_note_uz):article.editorial_note_uz;const canonical=`${base}/news/${newsSlug(article.title_uz,article.id)}`;
 if(slug!==newsSlug(article.title_uz,article.id))permanentRedirect(canonical.replace(base,""));
 const date=article.published_at??article.created_at;
 const schema={"@context":"https://schema.org","@type":"NewsArticle","mainEntityOfPage":{"@type":"WebPage","@id":canonical},"headline":title,"description":summary.slice(0,300),"image":article.image_url?[article.image_url]:undefined,"datePublished":date,"dateModified":article.created_at,"author":{"@type":"Organization","name":article.source_name},"publisher":{"@type":"Organization","name":"Cardrive.uz","url":base}};
 return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><Link href="/news" className="text-sm font-bold text-sky-700 hover:underline">← {ru?"Все новости":"Barcha yangiliklar"}</Link><article className="mt-5"><p className="text-xs font-black uppercase tracking-widest text-sky-600">CARDRIVE NEWS · {article.source_name}</p><h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{title}</h1><p className="mt-3 text-sm text-slate-500">{new Date(date).toLocaleDateString(ru?"ru-RU":"uz-UZ",{year:"numeric",month:"long",day:"numeric"})}</p>{article.image_url&&<div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100"><Image src={article.image_url} alt={title} fill unoptimized className="object-cover"/></div>}<div className="prose prose-slate mt-7 max-w-none"><p className="whitespace-pre-line text-lg leading-8">{summary}</p>{note&&<section className="not-prose mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-5"><h2 className="text-lg font-black text-slate-950">{ru?"Комментарий Cardrive":"Cardrive izohi"}</h2><p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{note}</p></section>}</div><div className="mt-8 border-t pt-5 text-sm text-slate-500">{ru?"Источник":"Asl manba"}: <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-700 underline">{article.source_name}</a></div></article></main>;
}
