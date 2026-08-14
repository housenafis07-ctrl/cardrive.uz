"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";

export function AccountLoginGate() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  if (authenticated) {
    return <p className="rounded-xl border bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Tasdiqlandi. Buyurtmalar yuklanmoqda...</p>;
  }

  return <PhoneOtpAuth purpose="login" onAuthenticated={() => { setAuthenticated(true); router.refresh(); }} title="Buyurtmalarni ko‘rish uchun telefon raqamingizni tasdiqlang" />;
}
