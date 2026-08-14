"use server";
import { revalidatePath } from "next/cache"; import { requireAdminUser } from "@/lib/admin-auth"; import { AdminOrderService } from "@/services/admin-order-service";
export async function updateOrderStatusAction(formData:FormData){const user=await requireAdminUser();const orderId=formData.get("orderId");const newStatus=formData.get("newStatus");if(typeof orderId!=="string"||typeof newStatus!=="string")return;await new AdminOrderService().updateStatus({orderId,newStatus},user.id);revalidatePath("/admin/orders");}
