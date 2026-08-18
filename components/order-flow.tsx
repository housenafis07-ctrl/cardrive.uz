"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { FinancingOptions, type FinancingProgram } from "@/components/financing-options";
import { createOrderAction } from "@/app/account/actions";
import { submitCreditApplicationAction } from "@/app/account/credit-actions";
import { formatPrice } from "@/lib/formatters";
import type { PurchaseType } from "@/types/domain";

const LABELS: Record<PurchaseType, string> = { cash: "Naqd pul", online: "Onlayn to'lov", credit: "Kredit", installment: "Bo'lib to'lash" };

export function OrderFlow({ carId, carName, price, currency, isAuthenticated, financingPrograms }: { carId: string; carName: string; price: number; currency: string; isAuthenticated: boolean; financingPrograms: FinancingProgram[] }) {
  const [step, setStep] = useState<"closed" | "auth" | "form" | "success">("closed");
  const [type, setType] = useState<PurchaseType>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [app, setApp] = useState("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if ((type === "credit" || type === "installment") && !selected) { setError("Avval bank va kredit dasturini tanlang."); return; }
    setLoading(true);
    const r = await createOrderAction({ carId, purchaseType: type, financingProgramId: selected ?? undefined, notes: notes.trim() || undefined });
    setLoading(false);
    if (r.status === "error") { setError(r.message); return; }
    setOrderId(r.orderId); setOrderNumber(r.orderNumber); setStep("success");
  }

  async function submitApp() {
    if (!selected) return;
    setApp("submitting");
    const fd = new FormData(); fd.set("orderId", orderId); fd.set("financingProgramId", selected);
    const r = await submitCreditApplicationAction(fd);
    if (r.status === "error") { setApp(r.message); return; }
    setApp(r.status);
  }

  if (step === "closed") return <button type="button" onClick={() => setStep(isAuthenticated ? "form" : "auth")} className="rounded-full bg-slate-950 px-5 py-3 font-bold text-white">Buyurtma berish</button>;

  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    {step === "auth" && <PhoneOtpAuth purpose="order" onAuthenticated={() => setStep("form")} />}
    {step === "form" && <form onSubmit={submit} className="space-y-4">
      <p className="text-lg font-bold">Buyurtmani tasdiqlash</p><p className="text-sm text-slate-500">{carName} — {formatPrice(price, currency)}</p>
      <fieldset className="space-y-2">{(Object.keys(LABELS) as PurchaseType[]).map(value => <label key={value} className="flex gap-2 text-sm"><input type="radio" name="purchaseType" value={value} checked={type === value} onChange={() => { setType(value); setSelected(null); setError(""); }} />{LABELS[value]}</label>)}</fieldset>
      {(type === "credit" || type === "installment") && <FinancingOptions carPrice={price} currency={currency} programs={financingPrograms} selectedProgramId={selected} onSelectProgram={setSelected} />}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-lg border px-3 py-2" placeholder="Izoh (ixtiyoriy)" />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-slate-950 py-3 font-bold text-white disabled:opacity-50">{loading ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}</button>
    </form>}
    {step === "success" && <div className="space-y-4 text-center">
      <p className="text-lg font-bold">Buyurtma qabul qilindi!</p><p className="text-sm">Buyurtma raqami: <b>{orderNumber}</b></p>
      {(type === "credit" || type === "installment") && selected && app !== "submitted" && app !== "already_exists" && <button type="button" onClick={submitApp} disabled={app === "submitting"} className="w-full rounded-full bg-slate-950 py-3 font-bold text-white">{app === "submitting" ? "Yuborilmoqda..." : "Kredit arizasini yuborish"}</button>}
      {app && app !== "idle" && app !== "submitting" && <p className="text-sm">{app === "submitted" ? "Kredit arizasi bankka yuborildi." : app === "already_exists" ? "Ariza allaqachon mavjud." : app}</p>}
      <Link href={`/account/orders/${orderId}`} className="inline-flex rounded-full bg-slate-950 px-5 py-3 font-bold text-white">Buyurtmani ko&apos;rish</Link>
    </div>}
  </div>;
}
