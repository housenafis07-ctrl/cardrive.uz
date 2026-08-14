import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
import type { OrderStatus, PurchaseType } from "@/types/domain";

export class OrderRepository {
  private db() { return createServiceRoleClient(); }
  async findForCustomer(customerId: string) { return this.db().from("orders").select("*,cars(name,slug,price,currency,stock_status)").eq("customer_id", customerId).order("created_at", { ascending: false }); }
  async findByIdForCustomer(orderId: string, customerId: string) { return this.db().from("orders").select("*,cars(name,slug,price,currency,stock_status),credit_applications(*)").eq("id", orderId).eq("customer_id", customerId).maybeSingle(); }
  async create(input: { orderNumber: string; customerId: string; carId: string; purchaseType: PurchaseType; totalAmount: number; currency: string; notes?: string }) { return this.db().from("orders").insert({ order_number: input.orderNumber, customer_id: input.customerId, car_id: input.carId, purchase_type: input.purchaseType, total_amount: input.totalAmount, currency: input.currency, notes: input.notes ?? null }).select().single(); }
  async findRecentDuplicate(customerId: string, carId: string, purchaseType: PurchaseType) { return this.db().from("orders").select("*").eq("customer_id", customerId).eq("car_id", carId).eq("purchase_type", purchaseType).in("status", ["pending", "confirmed", "processing"]).order("created_at", { ascending: false }).limit(1).maybeSingle(); }
  async updateStatus(orderId: string, status: OrderStatus) { return this.db().from("orders").update({ status }).eq("id", orderId).select().single(); }
  async createStatusHistory(input: { orderId: string; oldStatus: OrderStatus | null; newStatus: OrderStatus; changedBy?: string; note?: string }) { return this.db().from("order_status_history").insert({ order_id: input.orderId, old_status: input.oldStatus, new_status: input.newStatus, changed_by: input.changedBy ?? null, note: input.note ?? null }).select().single(); }
  async findStatusHistory(orderId: string, customerId: string) { return this.db().from("order_status_history").select("*").eq("order_id", orderId).order("created_at", { ascending: true }); }
}
