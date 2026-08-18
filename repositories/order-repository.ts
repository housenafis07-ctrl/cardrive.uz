import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
import type { OrderStatus, PurchaseType } from "@/types/domain";

const ORDER_WITH_CAR_SELECT = "*, cars(name,slug,car_images(public_url,alt_text,is_primary,sort_order))";

export class OrderRepository {
  async findForCustomer(customerId: string) {
    return createServiceRoleClient().from("orders").select(ORDER_WITH_CAR_SELECT).eq("customer_id", customerId).order("created_at", { ascending: false });
  }
  async findByIdForCustomer(orderId: string, customerId: string) {
    return createServiceRoleClient().from("orders").select(ORDER_WITH_CAR_SELECT).eq("id", orderId).eq("customer_id", customerId).maybeSingle();
  }
  async findRecentDuplicate(customerId: string, carId: string, purchaseType: PurchaseType, withinMs = 2 * 60 * 1000) {
    const cutoff = new Date(Date.now() - withinMs).toISOString();
    return createServiceRoleClient().from("orders").select("*").eq("customer_id", customerId).eq("car_id", carId).eq("purchase_type", purchaseType).eq("status", "pending").gte("created_at", cutoff).order("created_at", { ascending: false }).limit(1).maybeSingle();
  }
  async create(input: { orderNumber: string; customerId: string; carId: string; purchaseType: PurchaseType; financingProgramId?: string; totalAmount: number; currency: string; notes?: string }) {
    return createServiceRoleClient().from("orders").insert({ order_number: input.orderNumber, customer_id: input.customerId, car_id: input.carId, purchase_type: input.purchaseType, financing_program_id: input.financingProgramId ?? null, total_amount: input.totalAmount, currency: input.currency, notes: input.notes ?? null }).select().single();
  }
  async updateStatus(orderId: string, status: OrderStatus) { return createServiceRoleClient().from("orders").update({ status }).eq("id", orderId).select().single(); }
  async createStatusHistory(input: { orderId: string; oldStatus: OrderStatus | null; newStatus: OrderStatus; changedBy?: string; note?: string }) {
    return createServiceRoleClient().from("order_status_history").insert({ order_id: input.orderId, old_status: input.oldStatus, new_status: input.newStatus, changed_by: input.changedBy ?? null, note: input.note ?? null }).select().single();
  }
  async findStatusHistory(orderId: string, customerId: string) {
    return createServiceRoleClient().from("order_status_history").select("*, orders!inner(customer_id)").eq("order_id", orderId).eq("orders.customer_id", customerId).order("created_at", { ascending: true });
  }
}
