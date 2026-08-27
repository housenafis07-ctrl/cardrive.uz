import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
import type { PurchaseType } from "@/types/domain";

/**
 * Creates the immutable sales record for an order that has reached the
 * existing `completed` state. Existing order status flow is intentionally
 * left untouched.
 */
export class SalesCompletionService {
  async completeSale(orderId: string, actorId: string) {
    const client = createServiceRoleClient();
    const { data: order, error: orderError } = await client
      .from("orders")
      .select("id,status,purchase_type,total_amount,currency,cars(id,name,dealers(id,name)),financing_programs(id,name,banks(id,name))")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw new Error("Buyurtmani olishda xatolik.");
    if (!order) throw new Error("Buyurtma topilmadi.");
    if (order.status !== "completed") throw new Error("Avval buyurtmani 'Yakunlash' holatiga o'tkazing.");

    const purchaseType = order.purchase_type as PurchaseType;
    const car = Array.isArray(order.cars) ? order.cars[0] : order.cars;
    const dealer = car && Array.isArray(car.dealers) ? car.dealers[0] : car?.dealers;
    const program = Array.isArray(order.financing_programs) ? order.financing_programs[0] : order.financing_programs;
    const bank = program && Array.isArray(program.banks) ? program.banks[0] : program?.banks;

    const { data: existing } = await client.from("sales").select("id").eq("order_id", orderId).maybeSingle();
    if (existing) return existing;

    const isCredit = purchaseType === "credit";
    const isInstallment = purchaseType === "installment";
    const financedAmount = isCredit ? Number(order.total_amount) : 0;
    const dealerFinancedAmount = isInstallment ? Number(order.total_amount) : 0;

    const { data, error } = await client.from("sales").insert({
      order_id: order.id,
      car_id: car?.id ?? null,
      dealer_id: dealer?.id ?? null,
      bank_id: isCredit ? bank?.id ?? null : null,
      financing_program_id: (isCredit || isInstallment) ? program?.id ?? null : null,
      purchase_type: purchaseType === "online" ? "cash" : purchaseType,
      sale_status: "confirmed",
      sale_price: Number(order.total_amount),
      financed_amount: financedAmount,
      dealer_financed_amount: dealerFinancedAmount,
      bank_name_snapshot: bank?.name ?? null,
      financing_program_name_snapshot: program?.name ?? null,
      dealer_name_snapshot: dealer?.name ?? null,
      car_name_snapshot: car?.name ?? null,
      confirmed_at: new Date().toISOString(),
      created_by: actorId,
    }).select("id").single();

    if (error) throw new Error("Sotuvni saqlab bo'lmadi.");
    return data;
  }
}
