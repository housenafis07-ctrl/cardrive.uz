"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { submitUsedCarCreditApplication } from "@/app/avtobozor/credit-actions";
import type { FinancingProgram } from "@/components/financing-options";
import type { FormatterLocale } from "@/lib/formatters";

type Props={listingId:string;vehicleTitle:string;carPrice:number;currency:string;programs:FinancingProgram[];isAuthenticated:boolean;locale:FormatterLocale};
const words={
 uz:{apply:"Bankda hisob-kitobga buyurtma berish",bank:"Bank",rate:"Yillik foiz",down:"Boshlang‘ich to‘lov",term:"Muddat",monthly:"Taxminiy oylik to‘lov",title:"Kredit arizasi",desc:"Bank vakili individual kredit shartlarini aniqlashi uchun ma’lumotlaringizni yuboring.",phone:"Telefon raqami",pinfl:"JSHSHIR (14 raqam)",kind:"Hujjat turi",passport:"Pasport",id:"ID-karta",series:"Seriya (mavjud bo‘lsa)",number:"Hujjat raqami",front:"Old tomoni rasmi",back:"Orqa tomoni rasmi",consent:"Shaxsiy ma’lumotlarim, JSHSHIR va hujjat rasmlarim kredit arizamni ko‘rib chiqish va tanlangan bank bilan ishlash uchun Cardrive tomonidan qayta ishlanishiga roziman.",send:"Arizani yuborish",cancel:"Bekor qilish",login:"Kredit arizasini yuborishdan oldin Cardrive akkauntingizga kiring.",loginButton:"Cardrive’ga kirish",private:"Hujjatlar yopiq saqlanadi. Faqat vakolatli xodimlar vaqtinchalik havola orqali ko‘ra oladi.",success:"Arizangiz qabul qilindi. Cardrive menejeri siz bilan bog‘lanadi.",file:"JPG, PNG yoki WEBP · avtomatik siqiladi, har biri 1.3 MB gacha"},
 ru:{apply:"Заказать расчёт в банке",bank:"Банк",rate:"Годовая ставка",down:"Первоначальный взнос",term:"Срок",monthly:"Ориентировочный платёж в месяц",title:"Заявка на кредит",desc:"Отправьте данные для индивидуального расчёта условий представителем банка.",phone:"Номер телефона",pinfl:"ПИНФЛ (14 цифр)",kind:"Тип документа",passport:"Паспорт",id:"ID-карта",series:"Серия (если есть)",number:"Номер документа",front:"Лицевая сторона",back:"Обратная сторона",consent:"Я согласен на обработку Cardrive моих персональных данных, ПИНФЛ и изображений документа для рассмотрения заявки и взаимодействия с выбранным банком.",send:"Отправить заявку",cancel:"Отмена",login:"Чтобы отправить заявку, сначала войдите в аккаунт Cardrive.",loginButton:"Войти в Cardrive",private:"Документы хранятся в закрытом хранилище и доступны только уполномоченным сотрудникам по временной ссылке.",success:"Заявка принята. Менеджер Cardrive свяжется с вами.",file:"JPG, PNG или WEBP · автоматическое сжатие, до 1,3 МБ каждый"}
} as const;
const fmt=(v:number,c:string,ru:boolean)=>new Intl.NumberFormat(ru?"ru-RU":"uz-UZ",{maximumFractionDigits:0}).format(v)+(c==="USD"?" $":" so‘m");
async function compressDocument(input:HTMLInputElement){
 const file=input.files?.[0];if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){input.value="";window.alert("Faqat JPG, PNG yoki WEBP rasm yuklang.");return;}
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.decoding="async";
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Rasmni o‘qib bo‘lmadi"));image.src=url;});
  const scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext("2d");if(!context)throw new Error("Rasmni qayta ishlash imkoni bo‘lmadi");
  context.drawImage(image,0,0,canvas.width,canvas.height);
  let blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.86));
  if(!blob)throw new Error("Rasmni siqib bo‘lmadi");
  if(blob.size>1300*1024)blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.7));
  if(!blob||blob.size>1300*1024)throw new Error("Rasm 1.3 MB dan kichik bo‘lishi kerak");
  const prepared=new File([blob],file.name.replace(/\\.[^.]+$/,"")+".jpg",{type:"image/jpeg"});
  const transfer=new DataTransfer();transfer.items.add(prepared);input.files=transfer.files;
 }catch(error){input.value="";window.alert(error instanceof Error?error.message:"Rasmni tayyorlab bo‘lmadi");}
 finally{URL.revokeObjectURL(url);}
}
function payment(p:number,r:number,m:number){const x=r/1200;return Math.round(x===0?p/m:p*x/(1-Math.pow(1+x,-m)));}
export function UsedCarCreditApplicationPanel({listingId,vehicleTitle,carPrice,currency,programs,isAuthenticated,locale}:Props){
 const ru=locale==="ru",t=words[locale],pathname=usePathname(), [active,setActive]=useState<FinancingProgram|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[done,setDone]=useState(false);
 const open=(p:FinancingProgram)=>{setActive(p);setMessage("");setDone(false);};
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!active)return;setBusy(true);setMessage("");const fd=new FormData(e.currentTarget);fd.set("listingId",listingId);fd.set("programId",active.id);fd.set("personalDataConsent",fd.get("personalDataConsent")==="on"?"true":"false");const result=await submitUsedCarCreditApplication(fd);setBusy(false);if(!result.ok){setMessage(result.message);return;}setDone(true);setMessage(t.success);}
 return <div className="mt-5 grid gap-3 md:grid-cols-2">
  {programs.map(p=>{const bank=Array.isArray(p.banks)?p.banks[0]:p.banks;const rule=(p.financing_program_rules??[]).filter(r=>r.is_available!==false).slice().sort((a,b)=>a.down_payment_percent-b.down_payment_percent||b.term_months-a.term_months)[0];const down=Number(rule?.down_payment_percent??p.min_down_payment_percent??0),term=Number(rule?.term_months??p.max_term_months??0),rate=Number(rule?.annual_interest_rate??p.annual_interest_rate??0),creditPrice=Number(p.calculator_price??carPrice),creditCurrency=p.currency??currency,monthly=payment(Math.round(creditPrice*(1-down/100)),rate,term);return <article key={p.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-black">{bank?.name??(ru?"Банк":"Bank")}</p><p className="mt-1 text-sm text-slate-600">{ru?p.name_ru??p.name:p.name_uz??p.name}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><p className="rounded-lg bg-slate-50 p-2">{t.rate}: <b>{rate}%</b></p><p className="rounded-lg bg-slate-50 p-2">{t.down}: <b>{down}%</b></p><p className="rounded-lg bg-slate-50 p-2">{t.term}: <b>{term} {ru?"мес.":"oy"}</b></p><p className="rounded-lg bg-slate-50 p-2">{t.monthly}: <b>{fmt(monthly,creditCurrency,ru)}</b></p></div><button type="button" onClick={()=>open(p)} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t.apply}</button></article>})}
  {active&&<div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3"><form onSubmit={submit} className="my-auto max-h-[94vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
   <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{t.title}</h3><p className="mt-1 text-sm text-slate-500">{vehicleTitle}</p><p className="text-xs text-slate-500">{t.bank}: {(Array.isArray(active.banks)?active.banks[0]:active.banks)?.name??"—"}</p></div><button type="button" onClick={()=>setActive(null)} className="rounded-lg border px-3 py-1 text-sm">{t.cancel}</button></div>
   {!isAuthenticated?<div className="space-y-3 rounded-xl bg-amber-50 p-4"><p className="text-sm text-amber-900">{t.login}</p><a href={`/account/login?next=${encodeURIComponent(pathname||"/")}`} className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">{t.loginButton}</a></div>:done?<p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</p>:<>
   <p className="text-sm text-slate-600">{t.desc}</p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-bold sm:col-span-2">{t.phone}<input name="phone" required type="tel" defaultValue="+998" placeholder="+998 90 123 45 67" className="mt-1 w-full rounded-xl border p-3 text-sm font-medium"/></label>
    <label className="text-xs font-bold sm:col-span-2">{t.pinfl}<input name="pinfl" required inputMode="numeric" pattern="[0-9]{14}" minLength={14} maxLength={14} className="mt-1 w-full rounded-xl border p-3 text-sm font-medium"/></label>
    <label className="text-xs font-bold sm:col-span-2">{t.kind}<select name="documentType" className="mt-1 w-full rounded-xl border p-3 text-sm"><option value="passport">{t.passport}</option><option value="id_card">{t.id}</option></select></label>
    <label className="text-xs font-bold">{t.series}<input name="documentSeries" maxLength={2} pattern="[A-Za-z]{0,2}" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
    <label className="text-xs font-bold">{t.number}<input name="documentNumber" required minLength={7} maxLength={12} pattern="[A-Za-z0-9]{7,12}" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
    <label className="rounded-xl border border-dashed p-3 text-xs font-bold">{t.front}<input name="documentFront" type="file" required accept="image/jpeg,image/png,image/webp" onChange={e=>void compressDocument(e.currentTarget)} className="mt-2 block w-full text-xs font-normal"/></label>
    <label className="rounded-xl border border-dashed p-3 text-xs font-bold">{t.back}<input name="documentBack" type="file" required accept="image/jpeg,image/png,image/webp" onChange={e=>void compressDocument(e.currentTarget)} className="mt-2 block w-full text-xs font-normal"/></label>
   </div>
   <p className="text-xs text-slate-500">{t.file}</p>
   <label className="flex gap-3 rounded-xl border p-3 text-xs leading-5"><input name="personalDataConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0"/>{t.consent}</label>
   <p className="text-xs text-slate-500">{t.private}</p>
   {message&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
   <button disabled={busy} type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?(ru?"Отправка…":"Yuborilmoqda…"):t.send}</button>
   </>}
  </form></div>}
 </div>;
}
