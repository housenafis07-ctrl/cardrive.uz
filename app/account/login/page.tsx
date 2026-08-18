"use client";

import { useRouter } from "next/navigation";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";

export default function AccountLoginPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PhoneOtpAuth
          purpose="login"
          locale="uz"
          title="Tizimga kirish"
          onAuthenticated={() => {
            router.push("/");
            router.refresh();
          }}
        />
      </div>
    </main>
  );
}
