"use client";
import {useCallback,useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
type Media={id:string;original_name:string;size_bytes:number;status:"pending_review"|"approved"|"rejected";moderation_note:string|null;playbackUrl:string|null};
const MAX=50*1024*1024;const TYPES=new Set(["video/mp4","video/quicktime"]);
const labels={pending_review:"Moderatsiyada",approved:"Tasdiqlangan",rejected:"Rad etilgan"};
export default function UsedCarListingVideoManager({listingId,ru=false}:{listingId:string;ru?:boolean}){
 const [items,setItems]=useState<Media[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const load=useCallback(async()=>{const r=await fetch(`/api/avtobozor/listings/${listingId}/media`,{cache:"no-store"});const d=await r.json();if(r.ok)setItems(d.media??[]);},[listingId]);
 useEffect(()=>{void load();},[load]);
 async function upload(files:FileList|null){
  if(!files?.length)return;const chosen=Array.from(files);
  if(items.length+chosen.length>3){setMessage(ru?"Максимум 3 видео.":"Ko'pi bilan 3 ta video.");return;}
  if(chosen.some(f=>!TYPES.has(f.type)||f.size<1||f.size>MAX)){setMessage(ru?"Только MP4/MOV до 50 МБ.":"Faqat MP4/MOV, 50 MB gacha.");return;}
  setBusy(true);setMessage("");
  try{for(const file of chosen){
   const init=await fetch(`/api/avtobozor/listings/${listingId}/media`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:file.name,type:file.type,size:file.size})});
   const info=await init.json();if(!init.ok)throw new Error(info.error??"Upload error");
   const client=createClient(info.supabaseUrl,info.publicKey);
   const up=await client.storage.from(info.bucket).uploadToSignedUrl(info.path,info.token,file,{contentType:file.type,upsert:false});
   if(up.error)throw new Error(up.error.message);
   const done=await fetch(`/api/avtobozor/listings/${listingId}/media/complete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mediaId:info.mediaId})});
   const result=await done.json();if(!done.ok)throw new Error(result.error??"Upload completion error");
  }setMessage(ru?"Видео отправлено на модерацию.":"Video moderatsiyaga yuborildi.");await load();}
  catch(e){setMessage(e instanceof Error?e.message:"Video yuklashda xatolik.");await load();}finally{setBusy(false);}
 }
 async function remove(id:string){if(!window.confirm(ru?"Удалить видео?":"Videoni o'chirasizmi?"))return;setBusy(true);try{const r=await fetch(`/api/avtobozor/listings/${listingId}/media/${id}`,{method:"DELETE"});const d=await r.json();if(!r.ok)throw new Error(d.error??"Delete error");await load();}catch(e){setMessage(e instanceof Error?e.message:"O'chirishda xatolik.");}finally{setBusy(false);}}
 return <section className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">{ru?"Видео автомобиля":"Avtomobil videosi"} ({items.length}/3)</p><p className="text-xs text-slate-500">{ru?"MP4/MOV до 50 МБ. Публикация после проверки.":"MP4/MOV, har biri 50 MB gacha. Tasdiqlangandan keyin ko'rinadi."}</p></div>
  <label className={`cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white ${busy||items.length>=3?"pointer-events-none opacity-50":""}`}>{busy?(ru?"Загрузка...":"Yuklanmoqda..."):(ru?"Добавить видео":"Video qo'shish")}<input className="hidden" type="file" accept="video/mp4,video/quicktime" multiple disabled={busy||items.length>=3} onChange={e=>{void upload(e.target.files);e.currentTarget.value="";}}/></label></div>
  {message?<p className="mt-2 text-xs text-slate-700">{message}</p>:null}
  {items.map(item=><div key={item.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs"><div className="min-w-0"><p className="truncate font-semibold">{item.original_name}</p><p className="text-slate-500">{labels[item.status]} · {(item.size_bytes/1048576).toFixed(1)} MB</p>{item.moderation_note?<p className="text-red-700">{item.moderation_note}</p>:null}{item.status==="approved"&&item.playbackUrl?<a className="text-blue-700 underline" href={item.playbackUrl} target="_blank" rel="noreferrer">{ru?"Открыть видео":"Videoni ko'rish"}</a>:null}</div><button type="button" disabled={busy} onClick={()=>void remove(item.id)} className="rounded-lg border px-3 py-2">{ru?"Удалить":"O'chirish"}</button></div>)}
 </section>;
}
