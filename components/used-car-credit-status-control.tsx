"use client";
import { useState } from "react";
import { updateUsedCarCreditStatus } from "@/app/admin/used-car-credit-applications/actions";
const options=[["pending","Yangi"],["under_review","Tekshirilmoqda"],["sent_to_bank","Bankka yuborildi"],["approved","Tasdiqlandi"],["rejected","Rad etildi"],["cancelled","Bekor qilindi"]];
export function UsedCarCreditStatusControl({id,status}:{id:string;status:string}){
 const [value,setValue]=useState(status),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function save(){setBusy(true);setMessage("");const fd=new FormData();fd.set("applicationId",id);fd.set("status",value);const result=await updateUsedCarCreditStatus(fd);setBusy(false);setMessage(result.ok?"Saqlandi":result.message??"Xatolik");}
 return <div className="min-w-36 space-y-2"><select value={value} onChange={e=>setValue(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-xs">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button type="button" disabled={busy||value===status} onClick={()=>void save()} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{busy?"Saqlanmoqda…":"Holatni saqlash"}</button>{message&&<p role="status" className="text-[11px] text-slate-500">{message}</p>}</div>;
}
