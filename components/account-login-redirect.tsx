"use client";

import { useRouter } from "next/navigation";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import type { Locale } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

function safeReturnPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\") || value.includes("\\") ) {
    return "/";
  }
  return value;
}

export function LoginRedirect({ locale, next = "/" }: { locale: Locale; next?: string }) {
  const router = useRouter();
  const returnPath = safeReturnPath(next);

  return (
    <PhoneOtpAuth
      purpose="login"
      locale={locale}
      title={translations[locale].authTitle}
      onAuthenticated={() => {
        router.replace(returnPath);
        router.refresh();
      }}
    />
  );
}
