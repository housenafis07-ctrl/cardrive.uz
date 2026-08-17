"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

const value = (data: FormData, key: string) => {
  const v = data.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

export async function createDealerAction(data: FormData) {
  const user = await requireAdminUser();
  const name = value(data, "name");
  if (!name) redirect("/admin/dealers?error=Dealer+nomini+kiriting");
  const result = await createServiceRoleClient().from("dealers").insert({
    name,
    region: value(data, "region"),
    phone: value(data, "phone"),
    description: value(data, "description"),
    is_active: data.get("isActive") === "on",
  }).select("id").single();
  if (result.error) redirect(`/admin/dealers?error=${encodeURIComponent(result.error.message)}`);
  await createServiceRoleClient().from("audit_logs").insert({ actor_id: user.id, action: "dealer.created", entity_type: "dealer", entity_id: result.data.id, metadata: {} });
  revalidatePath("/admin/dealers");
  revalidatePath("/admin/cars");
  redirect("/admin/dealers?success=created");
}

export async function deactivateDealerAction(data: FormData) {
  const user = await requireAdminUser();
  const id = value(data, "id");
  if (!id) throw new Error("So‘rov yaroqsiz");
  await createServiceRoleClient().from("dealers").update({ is_active: false }).eq("id", id);
  await createServiceRoleClient().from("audit_logs").insert({ actor_id: user.id, action: "dealer.deactivated", entity_type: "dealer", entity_id: id, metadata: {} });
  revalidatePath("/admin/dealers");
  revalidatePath("/admin/cars");
}
