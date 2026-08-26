"use client";
import { useRouter } from "next/navigation";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
export function LoginRedirect({locale}:{locale:Locale}){const router=useRouter();return <PhoneOtpAuth purpose="login" locale={locale} title={translations[locale].authTitle} onAuthenticated={()=>{router.push("/");router.refresh();}}/>;}
