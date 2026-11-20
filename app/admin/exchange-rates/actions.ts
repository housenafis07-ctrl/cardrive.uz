"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { syncCbuUsdRate } from "@/lib/cbu-exchange-rates";

export async function syncCbuExchangeRateAction() {
  await requireAdminUser();
  try {
    const result = await syncCbuUsdRate();
    revalidatePath("/admin/exchange-rates");
    revalidatePath("/cars");
    revalidatePath("/avtobozor");
    redirect(`/admin/exchange-rates?success=1&rate=${encodeURIComponent(String(result.rate))}&date=${encodeURIComponent(result.rateDate)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    const message = error instanceof Error ? error.message : "Kursni yangilashda noma’lum xatolik";
    redirect(`/admin/exchange-rates?error=${encodeURIComponent(message)}`);
  }
}
