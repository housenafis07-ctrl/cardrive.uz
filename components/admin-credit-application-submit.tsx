"use client";
import {useState} from "react";
import {submitCreditApplicationAsAdminAction} from "@/app/admin/credit-actions";

export function AdminCreditApplicationSubmit({applicationId}:{applicationId:string}){
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  async function submit(){
    setLoading(true);setMessage("");
    const fd=new FormData();fd.set("applicationId",applicationId);
    const result=await submitCreditApplicationAsAdminAction(fd);
    setLoading(false);
    if(result.status==="error"){setMessage(result.message);return;}
    setMessage(result.applicationStatus==="submitted"?"Bankka yuborildi.":`Ariza holati: ${result.applicationStatus}`);
    window.location.reload();
  }
  return <div className="space-y-2"><button type="button" onClick={submit} disabled={loading} className="text-sm font-bold underline disabled:opacity-50">{loading?"Yuborilmoqda...":"Bankka yuborish"}</button>{message&&<p className="max-w-xs rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-700">{message}</p>}</div>;
}
