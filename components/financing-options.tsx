"use client";
import { FinancingCalculator } from "@/components/financing-calculator";

type Bank = { id:string; name:string; name_ru?:string|null; code:string; logo_url:string|null; website_url:string|null; integration_status:string; display_order:number };
export type FinancingRule = { id:string; down_payment_percent:number; term_months:number; annual_interest_rate:number; is_available:boolean; display_order:number };
export type FinancingProgram = {
  id:string; name:string; name_ru?:string|null; description:string|null; description_ru?:string|null; financing_type:string; annual_interest_rate:number|null; min_down_payment_percent:number|null;
  max_financing_percent:number|null; min_term_months:number|null; max_term_months:number|null; min_amount:number|null; max_amount:number|null;
  currency:string; eligibility_notes:string|null; eligibility_notes_ru?:string|null; source_url:string|null; source_label:string|null; last_verified_at:string|null;
  insurance_type:string|null; insurance_amount:number|null; insurance_percent:number|null; benefits_uz:string|null; benefits_ru:string|null; banks:Bank|null;
  financing_program_rules?: FinancingRule[];
};
const LABEL={uz:{credit:"Bo'lib to'lash",installment:"Bo'lib to'lash",promotional:"Aksiya"},ru:{credit:"Кредит",installment:"Рассрочка",promotional:"Акция"}} as const;

function ruFinancingText(value:string|null|undefined){
 if(!value)return value;
 const text=value.trim();
 const special=text.match(/^(.+?)[’']dan\s+(.+?)\s+avtomobillari uchun yillik\s+([\d.,]+%?)\s+dan\s+avtokredit$/i);
 if(special)return `${special[1]} — автокредит для автомобилей ${special[2]} от ${special[3].replace(/%$/,'')}% годовых`;
 const exact:{[key:string]:string}={
  "Ish joyi bo'lishi kerak":"Необходимо наличие места работы",
  "Ish joyi bo‘lishi kerak":"Необходимо наличие места работы",
  "Ish haqi loyihasi ishtirokchilari va byudjet tashkilotlari xodimlari uchun imtiyozlar bor":"Есть льготы для участников зарплатных проектов и сотрудников бюджетных организаций",
  "Ish haqi loyihasi ishtirokchilari va byudjet tashkilotlari xodimlari uchun imtiyozlar mavjud":"Предусмотрены льготы для участников зарплатных проектов и сотрудников бюджетных организаций",
 };
 if(exact[text])return exact[text];
 return text
  .replace(/avtokredit/gi,"автокредит")
  .replace(/kredit/gi,"кредит")
  .replace(/rassrochka/gi,"рассрочка")
  .replace(/bo['’]lib to['’]lash/gi,"рассрочка")
  .replace(/avtomobillari uchun/gi,"для автомобилей")
  .replace(/avtomobili uchun/gi,"для автомобиля")
  .replace(/yillik/gi,"годовых")
  .replace(/boshlang['’]ich to['’]lov/gi,"первоначальный взнос")
  .replace(/muddat/gi,"срок")
  .replace(/imtiyozlar/gi,"льготы")
  .replace(/bor$/i,"есть")
  .replace(/mavjud$/i,"доступны");
}

export function isZeroPercentProgram(program:FinancingProgram){
 const rules=Array.isArray(program.financing_program_rules)?program.financing_program_rules.filter(r=>r.is_available!==false):[];
 if(rules.length) return rules.every(r=>Number(r.annual_interest_rate)===0);
 return Number(program.annual_interest_rate??0)===0;
}
export function FinancingOptions({carPrice,currency,programs,selectedProgramId=null,onSelectProgram,purchaseType="credit",locale="uz"}:{carPrice:number;currency:string;programs:FinancingProgram[];selectedProgramId?:string|null;onSelectProgram?:(id:string)=>void;purchaseType:"credit"|"installment";locale?:"uz"|"ru"}){
 const visiblePrograms=programs.filter(program=>purchaseType==="installment"?(program.financing_type==="installment"||(program.financing_type==="credit"&&isZeroPercentProgram(program))):program.financing_type==="credit");
 if(!visiblePrograms.length)return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-600">{purchaseType==="installment"?(locale==="ru"?"Этот автомобиль нельзя приобрести в рассрочку":"Bu avtomobilni bo‘lib to‘lashga sotib olib bo‘lmaydi"):(locale==="ru"?"Условия кредита пока недоступны.":"Kredit shartlari hozircha mavjud emas.")}</div>;
 return <div className="space-y-4"><div><p className="text-lg font-black">{locale==="ru"?"Варианты кредита и рассрочки":"Kredit va bo‘lib to‘lash variantlari"}</p><p className="mt-1 text-sm text-slate-500">{locale==="ru"?"Для выбранного автомобиля показаны только комбинации первоначального взноса и срока, указанные банком или дилером.":"Tanlangan avtomobil uchun faqat bank yoki diler belgilagan boshlang‘ich to‘lov va muddat kombinatsiyalari ko‘rsatiladi."}</p></div>{visiblePrograms.map(program=>{const localizedProgram=locale==="ru"?{...program,name_ru:program.name_ru??ruFinancingText(program.name),description_ru:program.description_ru??ruFinancingText(program.description),eligibility_notes_ru:program.eligibility_notes_ru??ruFinancingText(program.eligibility_notes)}:program;return <div key={program.id}><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{LABEL[locale][program.financing_type as keyof typeof LABEL[typeof locale]]??program.financing_type}</span></div><FinancingCalculator carPrice={carPrice} currency={currency} program={localizedProgram} selected={selectedProgramId===program.id} selectable={true} onSelect={()=>onSelectProgram?.(program.id)} locale={locale}/></div>})}</div>;
}
