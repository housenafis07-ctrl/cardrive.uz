"use client";

import { useState } from "react";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";

export function AccountLoginGate() {
  const [authenticated, setAuthenticated] = useState(false);

  if (authenticated) {
    return <p className="rounded-xl border bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Tasdiqlandi. Sahifani yangilang yoki davom eting.</p>;
  }

  return <PhoneOtpAuth purpose="login" onAuthenticated={() => setAuthenticated(true)} title="Buyurtmalarni ko‘rish uchun telefon raqamingizni tasdiqlang" />;
}
