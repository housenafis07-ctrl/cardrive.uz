import { headers } from "next/headers";
import { requireAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-admin-login") === "1") return children;
  await requireAdminUser();
  return <AdminShell>{children}</AdminShell>;
}
