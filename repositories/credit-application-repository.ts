import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
export class CreditApplicationRepository {
  async findByOrderId(orderId: string) { return createServiceRoleClient().from("credit_applications").select("*").eq("order_id", orderId).maybeSingle(); }
  async findById(applicationId: string) { return createServiceRoleClient().from("credit_applications").select("*").eq("id", applicationId).maybeSingle(); }
  async updateStatus(applicationId: string, status: string) { return createServiceRoleClient().from("credit_applications").update({ status }).eq("id", applicationId).select().single(); }
  async create(input: { orderId: string; bankId: string; financingProgramId: string; externalApplicationId: string; status: string }) { return createServiceRoleClient().from("credit_applications").insert({ order_id: input.orderId, bank_id: input.bankId, financing_program_id: input.financingProgramId, external_application_id: input.externalApplicationId, status: input.status }).select().single(); }
}
