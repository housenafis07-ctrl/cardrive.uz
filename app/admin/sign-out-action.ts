"use server";

import { redirect } from "next/navigation";
import { requireAdminUser, signOutAdminUser } from "@/lib/admin-auth";

export async function signOutAction() {
  await requireAdminUser();
  await signOutAdminUser();
  redirect("/admin/login");
}
