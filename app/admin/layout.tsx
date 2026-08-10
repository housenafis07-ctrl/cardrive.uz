import { requireAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-ui";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdminUser();return <AdminShell>{children}</AdminShell>;}
