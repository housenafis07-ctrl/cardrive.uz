"use client";
import { FinancingCalculator } from "@/components/financing-calculator";

type Bank = { id:string; name:string; code:string; logo_url:string|null; website_url:string|null; integration_status:string; display_order:number };
export type FinancingRule = { id:string; down_payment_percent:number; term_months:number; annual_interest_rate:number; is_available:boolean; display_order:number };
export type FinancingProgram = {
  id:string; name:string; description:string|null; financing_type:string; annual_interest_rate:number|null; min_down_payment_percent:number|null;
  max_financing_percent:number|null; min_term_months:number|null; max_term_months:number|null; min_amount:number|null; max_amount:number|null;
  currency:string; eligibility_notes:string|null; source_url:string|null; source_label:string|null; last_verified_at:string|null;
  insurance_type:string|null; insurance_amount:number|null; insurance_percent:number|null; benefits_uz:string|null; benefits_ru:string|null; banks:Bank|null;
  financing_program_rules?: FinancingRule[];
};
const LABEL:Record<string,string>={credit:"Kredit",installment:"Bo'lib to'lash",promotional:"Aksiya"};
export function FinancingOptions({carPrice,currency,programs,selectedProgramId=null,onSelectProgram}:{carPrice:number;currency:string;programs:FinancingProgram[];selectedProgramId?:string|null;onSelectProgram?:(id:string)=>void}){
 if(!programs.length)return <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-slate-600">Kredit va bo&apos;lib to&apos;lash shartlari hozircha mavjud emas.</div>;
 return <div className="space-y-4"><div><p className="text-lg font-black">Kredit va bo&apos;lib to&apos;lash variantlari</p><p className="mt-1 text-sm text-slate-500">Tanlangan avtomobil uchun faqat bank belgilagan boshlang&apos;ich to&apos;lov va muddat kombinatsiyalari ko&apos;rsatiladi.</p></div>{programs.map(program=><div key={program.id}><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{LABEL[program.financing_type]??program.financing_type}</span></div><FinancingCalculator carPrice={carPrice} currency={currency} program={program} selected={selectedProgramId===program.id} selectable={true} onSelect={()=>onSelectProgram?.(program.id)}/></div>)}</div>;
}
