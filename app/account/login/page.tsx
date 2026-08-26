import { getLocale } from "@/lib/i18n";
import { LoginRedirect } from "@/components/account-login-redirect";

export default async function AccountLoginPage() {
  const locale = await getLocale();
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <LoginRedirect locale={locale} />
      </div>
    </main>
  );
}
