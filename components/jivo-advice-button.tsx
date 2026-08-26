"use client";

type FinancingSummary = {
  bankName: string;
  programName: string;
  interest: number | null;
  minDown: number | null;
  maxTerm: number | null;
};

type Props = { carName:string; brandName:string; priceText:string; pageUrl:string; financing:FinancingSummary[]; locale?:"uz"|"ru" };

declare global { interface Window { jivo_api?: { open:(params?:{start?:string})=>unknown; setCustomData:(fields:Array<Record<string,string>>)=>unknown; sendPageTitle:(title:string,fromApi?:boolean,url?:string)=>unknown; }; } }

export function JivoAdviceButton({carName,brandName,priceText,pageUrl,financing,locale="uz"}:Props){
 const openAdvice=()=>{const run=()=>{const api=window.jivo_api;if(!api)return false;const ru=locale==="ru";const financingText=financing.length?financing.slice(0,6).map(item=>{const rate=item.interest!==null?`${item.interest}%`:(ru?"индивидуально":"individual");const term=item.maxTerm?`${item.maxTerm} ${ru?"мес.":"oy"}`:(ru?"по доступным условиям":"mavjud shartlar bo‘yicha");const down=item.minDown!==null?`${item.minDown}% ${ru?"от":"dan"}`:(ru?"по доступным условиям":"mavjud shartlar bo‘yicha");return `${item.bankName} — ${item.programName} — ${rate} — ${term} — ${ru?"первоначальный взнос":"avans"} ${down}`;}).join("\n"):ru?"Информация о кредитных/рассрочных предложениях пока отсутствует.":"Hozircha kredit/rassrochka ma’lumotlari mavjud emas.";api.sendPageTitle(`${brandName} ${carName} — Cardrive.uz`,true,pageUrl);api.setCustomData([{title:ru?"🚗 Автомобиль":"🚗 Avtomobil",key:ru?"Модель":"Model",content:`${brandName} ${carName}`},{title:ru?"💰 Цена":"💰 Narx",key:ru?"Цена":"Narxi",content:priceText},{title:ru?"💳 Финансирование":"💳 Moliyalashtirish",key:ru?"Варианты":"Variantlar",content:financingText},{title:ru?"🔗 Страница":"🔗 Sahifa",content:ru?"Открыть страницу автомобиля":"Avtomobil sahifasini ochish",link:pageUrl}]);api.open({start:"chat"});return true;};if(run())return;let attempts=0;const timer=window.setInterval(()=>{attempts+=1;if(run()||attempts>=30)window.clearInterval(timer);},200);};
 return <button type="button" onClick={openAdvice} className="self-start shrink-0 rounded-full border border-slate-300 px-5 py-3 font-bold transition hover:border-slate-950 hover:bg-slate-50">{locale==="ru"?"Получить консультацию":"Maslahat olish"}</button>;
}
