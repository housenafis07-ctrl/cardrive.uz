"use client";
import { useMemo, useState } from "react";

type Rule={id?:string;down_payment_percent:number;term_months:number;annual_interest_rate:number;is_available:boolean;display_order?:number};
export function AdminFinancingRulesEditor({initialRules=[]}:{initialRules?:Rule[]}){
 const [rules,setRules]=useState<Rule[]>(initialRules.map((r,i)=>({...r,display_order:r.display_order??i})));
 const normalized=useMemo(()=>rules.map((r,i)=>({...r,down_payment_percent:Number(r.down_payment_percent),term_months:Number(r.term_months),annual_interest_rate:Number(r.annual_interest_rate),is_available:Boolean(r.is_available),display_order:i})),[rules]);
 const setRule=(index:number,key:keyof Rule,value:number|boolean)=>setRules(rows=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));
 const addRule=()=>setRules(rows=>[...rows,{down_payment_percent:25,term_months:36,annual_interest_rate:0,is_available:true,display_order:rows.length}]);
 const removeRule=(index:number)=>setRules(rows=>rows.filter((_,i)=>i!==index));
 const quickAdd=(down:number,terms:number[],rate:number)=>setRules(rows=>[...rows,...terms.map(term=>({down_payment_percent:down,term_months:term,annual_interest_rate:rate,is_available:true,display_order:rows.length}))]);
 return <div className="rounded-xl border bg-white p-3">
  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">Shartlar matritsasi</p><p className="text-xs text-slate-500">Masalan: 25% avans + 36 oy = 0%. Faqat qo‘shilgan kombinatsiyalar mijozga ko‘rsatiladi.</p></div><button type="button" onClick={addRule} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">+ Qator</button></div>
  <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-2 text-xs sm:grid-cols-[100px_100px_100px_1fr_auto]"><span>Avans %</span><span>Muddat, oy</span><span>Foiz %</span><span>Holat</span><span></span></div>
  <div className="mt-1 space-y-2">{normalized.map((r,i)=><div key={`${r.id??"new"}-${i}`} className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[100px_100px_100px_1fr_auto]"><input type="number" min="0" max="100" step="1" value={r.down_payment_percent} onChange={e=>setRule(i,"down_payment_percent",Number(e.target.value))} className="rounded border p-2 text-sm"/><input type="number" min="1" step="1" value={r.term_months} onChange={e=>setRule(i,"term_months",Number(e.target.value))} className="rounded border p-2 text-sm"/><input type="number" min="0" step="0.01" value={r.annual_interest_rate} onChange={e=>setRule(i,"annual_interest_rate",Number(e.target.value))} className="rounded border p-2 text-sm"/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.is_available} onChange={e=>setRule(i,"is_available",e.target.checked)}/> Mijozga ko‘rsatilsin</label><button type="button" onClick={()=>removeRule(i)} className="rounded border border-red-200 px-2 py-2 text-xs font-bold text-red-700">O‘chirish</button></div>)}</div>
  <div className="mt-3 flex flex-wrap gap-2"><span className="text-xs font-bold text-slate-500">Tez qo‘shish:</span>{[[25,[36],0],[30,[42],0],[40,[48],0],[50,[60],0]].map(([down,terms,rate])=><button key={`${down}`} type="button" onClick={()=>quickAdd(Number(down),terms as number[],Number(rate))} className="rounded-full border px-3 py-1 text-xs font-bold">{down}%</button>)}</div>
  <input type="hidden" name="rulesJson" value={JSON.stringify(normalized)}/>
 </div>;
}
