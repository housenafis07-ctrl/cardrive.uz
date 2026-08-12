import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = { title: "Admin Login | Cardrive.uz" };

export default function AdminLoginPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5"><AdminLoginForm /></main>;
}
