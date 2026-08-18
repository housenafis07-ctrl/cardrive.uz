"use server";

import { clearCustomerSession } from "@/lib/customer-session";
import { revalidatePath } from "next/cache";

export async function signOutCustomerAction() {
  await clearCustomerSession();
  revalidatePath("/");
  revalidatePath("/account/orders");
}
