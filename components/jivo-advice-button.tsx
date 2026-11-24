"use client";
type FinancingSummary={bankName:string;programName:string;interest:number|null;minDown:number|null;maxTerm:number|null};
type Props={carName:string;brandName:string;priceText:string;pageUrl:string;financing:FinancingSummary[];locale?:"uz"|"ru"};
export function JivoAdviceButton({carName,brandName,priceText,pageUrl,financing,locale="uz"}:Props){
 const isRu=locale==="ru";
 function openAdvice(){
  const financingText=financing.length?financing.slice(0,6).map(item=>`${item.bankName} — ${item.programName} — ${item.interest!==null?item.interest+"%":(isRu?"индивидуально":"individual")} — ${item.maxTerm??"—"} ${isRu?"мес.":"oy"} — ${item.minDown!==null?item.minDown+"%": "—"}`).join("\n"):(isRu?"Условия финансирования пока не указаны.":"Moliyalashtirish shartlari hozircha ko‘rsatilmagan.");
  const initialMessage=isRu?`Здравствуйте! Хочу получить консультацию по автомобилю ${brandName} ${carName}. Цена: ${priceText}.\nВарианты финансирования:\n${financingText}`:`Assalomu alaykum! ${brandName} ${carName} avtomobili bo‘yicha maslahat olmoqchiman. Narxi: ${priceText}.\nMoliyalashtirish variantlari:\n${financingText}`;
  window.dispatchEvent(new CustomEvent("cardrive:open-chat",{detail:{carName:`${brandName} ${carName}`,carUrl:pageUrl,pageTitle:`${brandName} ${carName} — Cardrive.uz`,initialMessage}}));
 }
 return <button type="button" onClick={openAdvice} className="self-start shrink-0 rounded-full border border-slate-300 px-5 py-3 font-bold transition hover:border-slate-950 hover:bg-slate-50">{isRu?"Получить консультацию":"Maslahat olish"}</button>;
}
