"use server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { AdminOrderService } from "@/services/admin-order-service";
export async function updateManagerOrderAction(formData:FormData){const user=await requireAdminUser();const input:Record<string,unknown>={};for(const key of ["orderId","fullName","phone","color","downPaymentPercent","downPaymentAmount","financedAmount","interestRate","termMonths","notes"])input[key]=formData.get(key)?.toString()??"";await new AdminOrderService().updateManagerOrder(input,user.id);const orderId=input.orderId as string;revalidatePath(`/admin/orders/${orderId}`);revalidatePath("/admin/orders");}
