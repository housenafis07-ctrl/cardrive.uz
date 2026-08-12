"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Email yoki parol noto‘g‘ri.");
      setLoading(false);
      return;
    }
    window.location.assign("/admin");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-7 shadow-sm">
      <div>
        <p className="text-sm font-bold text-amber-600">CARDRIVE ADMIN</p>
        <h1 className="mt-1 text-3xl font-black">Kirish</h1>
        <p className="mt-2 text-sm text-slate-500">Admin panelga kirish uchun email va parolingizni kiriting.</p>
      </div>
      <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Parol<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={loading} className="w-full rounded-full bg-slate-950 py-3 font-bold text-white disabled:opacity-50">{loading ? "Kirilmoqda..." : "Kirish"}</button>
    </form>
  );
}
