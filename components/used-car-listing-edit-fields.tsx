"use client";

import { useState } from "react";
import { VEHICLE_BRANDS } from "@/lib/vehicle-catalog";

const colors = [
  { value:"Marvarid oq", ru:"Жемчужно-белый", hex:"#f8fafc" },
  { value:"Oq", ru:"Белый", hex:"#ffffff" },
  { value:"Qora", ru:"Чёрный", hex:"#202124" },
  { value:"Grafit", ru:"Графитовый", hex:"#45484d" },
  { value:"Kulrang", ru:"Серый", hex:"#92979d" },
  { value:"Kumushrang", ru:"Серебристый", hex:"#c0c6cc" },
  { value:"Metallik kulrang", ru:"Серый металлик", hex:"#737b84" },
  { value:"To'q ko'k", ru:"Тёмно-синий", hex:"#102f58" },
  { value:"Ko'k", ru:"Синий", hex:"#2563eb" },
  { value:"Havorang", ru:"Голубой", hex:"#65b9e8" },
  { value:"Qizil", ru:"Красный", hex:"#dc2626" },
  { value:"Olcha rang", ru:"Вишнёвый", hex:"#8f1d35" },
  { value:"Bordo", ru:"Бордовый", hex:"#651b32" },
  { value:"Yashil", ru:"Зелёный", hex:"#16834a" },
  { value:"Zaytunrang", ru:"Оливковый", hex:"#747b38" },
  { value:"Feruza", ru:"Бирюзовый", hex:"#26a6a1" },
  { value:"Binafsha", ru:"Фиолетовый", hex:"#7650a8" },
  { value:"Pushti", ru:"Розовый", hex:"#e78aa7" },
  { value:"Bej", ru:"Бежевый", hex:"#cbb99b" },
  { value:"Kremrang", ru:"Кремовый", hex:"#eee0c2" },
  { value:"Jigarrang", ru:"Коричневый", hex:"#80543b" },
  { value:"Bronza", ru:"Бронзовый", hex:"#9a6846" },
  { value:"Oltinrang", ru:"Золотистый", hex:"#c5a34d" },
  { value:"To'q sariq", ru:"Оранжевый", hex:"#ea7a24" },
  { value:"Sariq", ru:"Жёлтый", hex:"#eabf32" },
];

export function UsedCarListingEditFields({ brand, model, color, ru=false }: { brand:string; model:string; color:string|null; ru?:boolean }) {
  const brandMatch=VEHICLE_BRANDS.find(item=>item.name.toLowerCase()===brand.trim().toLowerCase());
  const [selectedBrand,setSelectedBrand]=useState(brandMatch?.name ?? "Other");
  const [customBrand,setCustomBrand]=useState(brandMatch ? "" : brand);
  const activeBrand=VEHICLE_BRANDS.find(item=>item.name===selectedBrand);
  const modelMatch=brandMatch?.models.some(item=>item.toLowerCase()===model.trim().toLowerCase());
  const [selectedModel,setSelectedModel]=useState(modelMatch ? model : "__other__");
  const [customModel,setCustomModel]=useState(modelMatch ? "" : model);
  const knownColor=colors.some(item=>item.value===color);
  const [selectedColor,setSelectedColor]=useState(knownColor ? color! : "__custom__");
  const [customColor,setCustomColor]=useState(knownColor ? "" : color ?? "");

  return <>
    <label className="block min-w-0 text-sm font-semibold">{ru?"Марка":"Brend"} *
      {selectedBrand==="Other" ? <input name="brand" required maxLength={80} value={customBrand} onChange={e=>setCustomBrand(e.target.value)} placeholder={ru?"Введите марку":"Brend nomini kiriting"} className="mt-1 w-full rounded-xl border p-3 font-normal"/> :
        <span className="mt-1 flex items-center gap-2 rounded-xl border px-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">{activeBrand?.logo ? <img src={activeBrand.logo} alt="" className="h-7 w-7 object-contain"/> : <span className="text-xs font-black">{selectedBrand.slice(0,2).toUpperCase()}</span>}</span>
          <select name="brand" required value={selectedBrand} onChange={e=>{setSelectedBrand(e.target.value);setSelectedModel("");setCustomModel("");}} className="min-w-0 flex-1 border-0 bg-transparent p-3 outline-none">
            {VEHICLE_BRANDS.map(item=><option key={item.slug} value={item.name}>{item.name}</option>)}
          </select>
        </span>}
    </label>
    <label className="block min-w-0 text-sm font-semibold">{ru?"Модель":"Model"} *
      {selectedBrand==="Other" || selectedModel==="__other__" || !activeBrand?.models.length ?
        <input name="model" required maxLength={100} value={customModel} onChange={e=>setCustomModel(e.target.value)} placeholder={ru?"Введите модель":"Modelni kiriting"} className="mt-1 w-full rounded-xl border p-3 font-normal"/> :
        <select name="model" required value={selectedModel} onChange={e=>{setSelectedModel(e.target.value);if(e.target.value!=="__other__")setCustomModel("");}} className="mt-1 w-full rounded-xl border p-3 font-normal">
          <option value="" disabled>{ru?"Выберите модель":"Modelni tanlang"}</option>
          {activeBrand.models.map(item=><option key={item} value={item}>{item}</option>)}
          <option value="__other__">{ru?"Другая модель":"Boshqa model"}</option>
        </select>}
    </label>
    <fieldset className="sm:col-span-2 min-w-0">
      <legend className="mb-3 text-sm font-bold">{ru?"Цвет автомобиля":"Avtomobil rangi"} *</legend>
      <input type="hidden" name="color" value={selectedColor==="__custom__"?customColor:selectedColor}/>
      <div className="max-w-full overflow-x-auto px-1 pb-3"><div className="flex w-max gap-3">
        {colors.map(item=>{const selected=selectedColor===item.value;return <button key={item.value} type="button" aria-label={ru?item.ru:item.value} aria-pressed={selected} title={ru?item.ru:item.value} onClick={()=>setSelectedColor(item.value)} className={"h-12 w-12 shrink-0 rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 "+(selected?"border-blue-600 ring-2 ring-blue-200 ring-offset-2":"border-slate-200")} style={{background:item.hex}}/>;})}
        <button type="button" aria-label={ru?"Другой цвет":"Boshqa rang"} aria-pressed={selectedColor==="__custom__"} onClick={()=>setSelectedColor("__custom__")} className={"h-12 w-12 shrink-0 rounded-full border-2 "+(selectedColor==="__custom__"?"border-blue-600 ring-2 ring-blue-200 ring-offset-2":"border-slate-200")} style={{background:"conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)"}}/>
      </div></div>
      {selectedColor==="__custom__" ? <input aria-label={ru?"Другой цвет":"Boshqa rang"} required maxLength={40} value={customColor} onChange={e=>setCustomColor(e.target.value)} placeholder={ru?"Укажите цвет":"Rang nomini kiriting"} className="mt-2 w-full rounded-xl border p-3 font-normal"/> : null}
      <p className="mt-1 text-xs text-slate-500">{ru?"Выбранный цвет: ":"Tanlangan rang: "}{selectedColor==="__custom__"?(customColor|| (ru?"Другой":"Boshqa")):(ru?colors.find(item=>item.value===selectedColor)?.ru:selectedColor)}</p>
    </fieldset>
  </>;
}
