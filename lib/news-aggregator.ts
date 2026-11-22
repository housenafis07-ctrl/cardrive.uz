import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type FeedSource={id:string;name:string;feed_url:string;language:string;fetch_interval_minutes:number;last_fetched_at:string|null};
type FeedEntry={id:string;url:string;title:string;summary:string;image:string|null;publishedAt:string|null};
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/\s+/g," ").trim();
const tag=(xml:string,name:string)=>{const m=new RegExp("<(?:[\\w.-]+:)?"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?"+name+"\\s*>","i").exec(xml);return m?decode(m[1]):""};
function parseFeed(xml:string,base:string):FeedEntry[]{
 const blocks=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map(m=>m[2]).slice(0,30);
 return blocks.map((b,i)=>{
  const title=tag(b,"title"); const summary=tag(b,"description")||tag(b,"summary")||tag(b,"content:encoded")||tag(b,"content");
  const linkMatch=/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i.exec(b);
  const link=tag(b,"link")||linkMatch?.[1]||tag(b,"guid")||tag(b,"id");
  const image=/<(?:media:content|media:thumbnail|enclosure)\b[^>]*(?:url|href)=["']([^"']+)["'][^>]*>/i.exec(b)?.[1]||/<img\b[^>]*src=["']([^"']+)["']/i.exec(summary)?.[1]||null;
  const date=tag(b,"pubDate")||tag(b,"published")||tag(b,"updated")||tag(b,"dc:date");
  const url=(()=>{try{return new URL(link,base).toString()}catch{return ""}})();
  const publishedAt=date&&!Number.isNaN(Date.parse(date))?new Date(date).toISOString():null;
  return {id:tag(b,"guid")||tag(b,"id")||url||String(i),url,title,summary,image,publishedAt};
 }).filter(x=>x.title&&x.url);
}
async function translate(title:string,summary:string,sourceLanguage:string){
 const key=process.env.OPENAI_API_KEY;if(!key)throw new Error("OPENAI_API_KEY is required for automatic news translation");
 const response=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model:process.env.NEWS_TRANSLATION_MODEL||"gpt-4o-mini",temperature:0.2,response_format:{type:"json_object"},messages:[{role:"system",content:"Translate the news title and short summary into Uzbek, Russian, and English. Preserve factual meaning, names, numbers and neutral journalistic tone. Do not add facts. Return JSON with title_uz,summary_uz,title_ru,summary_ru,title_en,summary_en."},{role:"user",content:JSON.stringify({source_language:sourceLanguage,title,summary:summary.slice(0,1800)})}]})});
 if(!response.ok)throw new Error("Translation API returned HTTP "+response.status);
 const data=await response.json();const content=data.choices?.[0]?.message?.content;if(!content)throw new Error("Translation API returned empty content");return JSON.parse(content) as Record<string,string>;
}
export async function syncNewsFeeds(options:{force?:boolean}={}){
 const db=createServiceRoleClient();const {data:sources,error}=await db.from("news_sources").select("*").eq("is_active",true).limit(50);if(error)throw error;
 const now=Date.now();let imported=0,skipped=0,failed=0;const details:string[]=[];
 for(const source of (sources??[]) as FeedSource[]){
  const last=source.last_fetched_at?Date.parse(source.last_fetched_at):0;
  if(!options.force&&last&&now-last<source.fetch_interval_minutes*60_000){skipped++;continue}
  try{
   const parsed=new URL(source.feed_url);if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error("Feed URL must be a public HTTP(S) URL");
   if(["localhost","127.0.0.1","0.0.0.0","::1"].includes(parsed.hostname))throw new Error("Local feed URLs are not allowed");
   const res=await fetch(source.feed_url,{headers:{Accept:"application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8","User-Agent":"CardriveNewsBot/1.0"},signal:AbortSignal.timeout(15000),redirect:"error"});
   if(!res.ok)throw new Error("Feed returned HTTP "+res.status);
   const xml=await res.text();if(xml.length>2_000_000)throw new Error("Feed exceeds 2 MB limit");
   const entries=parseFeed(xml,source.feed_url);
   for(const entry of entries){
    const {data:existing}=await db.from("news_articles").select("id").eq("source_id",source.id).eq("external_id",entry.id).maybeSingle();if(existing){skipped++;continue}
    const cleanSummary=entry.summary.slice(0,3000);
    const tr=await translate(entry.title,cleanSummary,source.language);
    const record={source_id:source.id,external_id:entry.id,source_url:entry.url,source_name:source.name,original_language:source.language,title_original:entry.title,summary_original:cleanSummary,title_uz:tr.title_uz||entry.title,summary_uz:tr.summary_uz||cleanSummary,title_ru:tr.title_ru||entry.title,summary_ru:tr.summary_ru||cleanSummary,title_en:tr.title_en||entry.title,summary_en:tr.summary_en||cleanSummary,image_url:entry.image,published_at:entry.publishedAt,is_published:false,moderation_status:"pending"};
    const {error:insertError}=await db.from("news_articles").insert(record);if(insertError&&insertError.code!=="23505")throw insertError; if(!insertError)imported++;
   }
   await db.from("news_sources").update({last_fetched_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq("id",source.id);
  }catch(e){failed++;const message=e instanceof Error?e.message:"Unknown feed error";details.push(source.name+": "+message);await db.from("news_sources").update({last_fetched_at:new Date().toISOString(),last_error:message,updated_at:new Date().toISOString()}).eq("id",source.id)}
 }
 return {imported,skipped,failed,details};
}


/**
 * Admin-only diagnostic: fetch exactly one source and import at most one new article.
 * Does not alter the normal daily sync behavior.
 */
export async function testNewsSource(sourceId:string){
 const db=createServiceRoleClient();
 const {data:source,error:sourceError}=await db.from("news_sources").select("*").eq("id",sourceId).single();
 if(sourceError||!source)throw new Error(sourceError?.message||"News source not found");
 const parsed=new URL(source.feed_url);
 if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error("Feed URL must be a public HTTP(S) URL");
 if(["localhost","127.0.0.1","0.0.0.0","::1"].includes(parsed.hostname))throw new Error("Local feed URLs are not allowed");
 try{
  const response=await fetch(source.feed_url,{headers:{Accept:"application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8","User-Agent":"CardriveNewsBot/1.0"},signal:AbortSignal.timeout(15000),redirect:"error"});
  if(!response.ok)throw new Error("Feed returned HTTP "+response.status);
  const xml=await response.text();
  if(xml.length>2_000_000)throw new Error("Feed exceeds 2 MB limit");
  const entries=parseFeed(xml,source.feed_url);
  if(!entries.length)throw new Error("RSS/Atom feed parsed successfully but contained no usable articles");
  let importedTitle:string|null=null;
  let duplicateCount=0;
  for(const entry of entries){
   const {data:existing,error:lookupError}=await db.from("news_articles").select("id").eq("source_id",source.id).eq("external_id",entry.id).maybeSingle();
   if(lookupError)throw lookupError;
   if(existing){duplicateCount++;continue;}
   const summary=entry.summary.slice(0,3000);
   const translated=await translate(entry.title,summary,source.language);
   const record={source_id:source.id,external_id:entry.id,source_url:entry.url,source_name:source.name,original_language:source.language,title_original:entry.title,summary_original:summary,title_uz:translated.title_uz||entry.title,summary_uz:translated.summary_uz||summary,title_ru:translated.title_ru||entry.title,summary_ru:translated.summary_ru||summary,title_en:translated.title_en||entry.title,summary_en:translated.summary_en||summary,image_url:entry.image,published_at:entry.publishedAt,is_published:false,moderation_status:"pending"};
   const {error:insertError}=await db.from("news_articles").insert(record);
   if(insertError){if(insertError.code==="23505"){duplicateCount++;continue;}throw insertError;}
   importedTitle=entry.title;
   break;
  }
  const checkedAt=new Date().toISOString();
  const {error:updateError}=await db.from("news_sources").update({last_fetched_at:checkedAt,last_error:null,updated_at:checkedAt}).eq("id",source.id);
  if(updateError)throw updateError;
  return {source:source.name,feedEntries:entries.length,imported:importedTitle?1:0,duplicateCount,title:importedTitle,checkedAt};
 }catch(error){
  const message=error instanceof Error?error.message:"Unknown RSS test error";
  const checkedAt=new Date().toISOString();
  await db.from("news_sources").update({last_fetched_at:checkedAt,last_error:message,updated_at:checkedAt}).eq("id",source.id);
  throw new Error(source.name+": "+message);
 }
}
