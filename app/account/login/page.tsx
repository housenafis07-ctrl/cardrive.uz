import { getLocale, translations } from "@/lib/i18n";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { LoginRedirect } from "@/components/account-login-redirect";

export default async function AccountLoginPage() {
  const locale = await getLocale();
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PhoneOtpAuth purpose="login" locale={locale} title={translations[locale].authTitle} onAuthenticated={() => {}} />
      </div>
      <LoginRedirect />
    </main>
  );
}
