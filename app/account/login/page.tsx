"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/account/otp/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "SMS kodini yuborib bo‘lmadi");
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Xatolik yuz berdi"); }
    finally { setLoading(false); }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/account/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Kod noto‘g‘ri");
      router.push("/"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Xatolik yuz berdi"); }
    finally { setLoading(false); }
  }

  return <main className="mx-auto max-w-md px-4 py-16"><div className="rounded-2xl border bg-white p-6 shadow-sm"><h1 className="text-2xl font-black">Kirish</h1><p className="mt-2 text-sm text-slate-500">Telefon raqamingiz orqali tizimga kiring.</p><form onSubmit={sent ? verifyOtp : requestOtp} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Telefon raqami<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="mt-1 w-full rounded-xl border p-3" disabled={sent}/></label>{sent&&<label className="block text-sm font-semibold">SMS kodi<input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" className="mt-1 w-full rounded-xl border p-3"/></label>}{error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-slate-950 p-3 font-bold text-white">{loading?"Kutilmoqda...":sent?"Kirish":"SMS kod yuborish"}</button>{sent&&<button type="button" onClick={()=>{setSent(false);setCode("");setError("")}} className="w-full text-sm font-semibold text-slate-600">Raqamni o‘zgartirish</button>}</form></div></main>;
}
