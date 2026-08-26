"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
export function AccountLoginGate({locale="uz"}:{locale?:Locale}){const router=useRouter();const[authenticated,setAuthenticated]=useState(false);const t=translations[locale];if(authenticated)return <p className="rounded-xl border bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{t.accountVerified}</p>;return <PhoneOtpAuth purpose="login" locale={locale} onAuthenticated={()=>{setAuthenticated(true);router.refresh();}} title={t.accountGate}/>}
