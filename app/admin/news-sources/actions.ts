"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {requireAdminUser} from "@/lib/admin-auth";
import {createServiceRoleClient} from "@/supabase/server";
const v=(fd:FormData,k:string)=>{const x=fd.get(k);return typeof x==="string"?x.trim():""};
export async function saveNewsSourceAction(fd:FormData){
 await requireAdminUser();const id=v(fd,"id"),name=v(fd,"name"),url=v(fd,"feedUrl"),language=v(fd,"language"),interval=Number(v(fd,"interval")||30);
 let parsed:URL;try{parsed=new URL(url)}catch{redirect("/admin/news-sources?error=Noto‘g‘ri+URL")}
 if(!name||!["http:","https:"].includes(parsed!.protocol)||parsed!.username||parsed!.password)redirect("/admin/news-sources?error=Manba+nomi+va+ochiq+HTTP(S)+RSS+havolasini+kiriting");
 if(!["auto","uz","ru","en"].includes(language)||!Number.isInteger(interval)||interval<15||interval>1440)redirect("/admin/news-sources?error=Til+yoki+interval+qiymati+noto‘g‘ri");
 const db=createServiceRoleClient();const payload={name,feed_url:url,language,fetch_interval_minutes:interval,is_active:fd.get("isActive")==="on",updated_at:new Date().toISOString()};
 const result=id?await db.from("news_sources").update(payload).eq("id",id):await db.from("news_sources").insert(payload);
 if(result.error)redirect("/admin/news-sources?error="+encodeURIComponent(result.error.message));
 revalidatePath("/admin/news-sources");redirect("/admin/news-sources?saved=1");
}
export async function deleteNewsSourceAction(fd:FormData){await requireAdminUser();const id=v(fd,"id");if(!id)throw new Error("Manba topilmadi");const db=createServiceRoleClient();await db.from("news_sources").delete().eq("id",id);revalidatePath("/admin/news-sources");}
