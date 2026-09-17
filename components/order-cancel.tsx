"use client";
import { useState } from "react";
import { cancelOrderAction } from "@/app/account/actions";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
export function OrderCancel({orderId,locale}:{orderId:string;locale:Locale}){const[loading,setLoading]=useState(false);const[error,setError]=useState("");const t=translations[locale];async function onCancel(){if(!window.confirm(locale==="ru"?"Вы хотите отменить заказ?":"Buyurtmani bekor qilishni xohlaysizmi?"))return;setError("");setLoading(true);const fd=new FormData();fd.set("orderId",orderId);const result=await cancelOrderAction(fd);setLoading(false);if(result.status==="error"){setError(result.message);return;}window.location.reload();}return <div className="mt-3"><button type="button" onClick={onCancel} disabled={loading} className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">{loading?(locale==="ru"?"Отмена...":"Bekor qilinmoqda..."):(locale==="ru"?"Отменить":"Bekor qilish")}</button>{error&&<p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}</div>}
