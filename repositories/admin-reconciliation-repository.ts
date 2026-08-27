import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type Relation<T> = T | T[] | null;
const first = <T>(v: Relation<T> | undefined): T | null => Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export type ReconciliationFilters = { dateFrom?: string; dateTo?: string; bank?: string; dealer?: string; program?: string; purchaseType?: string; status?: string };
export type ReconciliationRow = {
  id:string; orderNumber:string; createdAt:string; customerName:string; phone:string; car:string; color:string; price:number;
  downPayment:number; financedAmount:number; interestRate:number; termMonths:number; bank:string; program:string; dealer:string;
  purchaseType:string; status:string; applicationCreatedAt:string; consentAt:string; submittedAt:string; applicationStatus:string;
};

export class AdminReconciliationRepository {
  async list(filters: ReconciliationFilters = {}) {
    const client = createServiceRoleClient();
    const r = await client.from("orders").select("id,order_number,created_at,status,purchase_type,total_amount,manager_overrides,profiles!orders_customer_id_fkey(full_name,phone),cars(name,color,price,car_models(name),dealers(name)),financing_programs(name,down_payment_percent,term_months,interest_rate,banks(name)),credit_applications(status,created_at,oneid_consent_confirmed_at,submitted_at)").order("created_at", { ascending:false });
    if (r.error) throw r.error;
    const rows = (r.data ?? []) as any[];
    const result: ReconciliationRow[] = [];
    for (const row of rows) {
      const p = first(row.financing_programs); const b = first(p?.banks); const car = first(row.cars); const model = first(car?.car_models); const dealer = first(car?.dealers); const profile = first(row.profiles); const app = first(row.credit_applications); const ov = row.manager_overrides ?? {};
      const date = new Date(row.created_at);
      if (filters.dateFrom && date < new Date(`${filters.dateFrom}T00:00:00`)) continue;
      if (filters.dateTo && date > new Date(`${filters.dateTo}T23:59:59.999`)) continue;
      if (filters.bank && b?.name !== filters.bank) continue;
      if (filters.dealer && dealer?.name !== filters.dealer) continue;
      if (filters.program && p?.name !== filters.program) continue;
      if (filters.purchaseType && row.purchase_type !== filters.purchaseType) continue;
      if (filters.status && row.status !== filters.status) continue;
      const total = Number(row.total_amount) || 0;
      const downPercent = Number(ov.finance?.downPaymentPercent ?? p?.down_payment_percent ?? 0);
      const down = Number(ov.finance?.downPaymentAmount ?? total * downPercent / 100);
      const financed = Number(ov.finance?.financedAmount ?? Math.max(0, total - down));
      result.push({ id:row.id, orderNumber:row.order_number, createdAt:row.created_at, customerName:ov.customer?.fullName ?? profile?.full_name ?? "—", phone:ov.customer?.phone ?? profile?.phone ?? "—", car:[model?.name,car?.name].filter(Boolean).join(" — ") || "—", color:ov.car?.color ?? car?.color ?? "—", price:Number(car?.price ?? total), downPayment:down, financedAmount:financed, interestRate:Number(ov.finance?.interestRate ?? p?.interest_rate ?? 0), termMonths:Number(ov.finance?.termMonths ?? p?.term_months ?? 0), bank:b?.name ?? "—", program:p?.name ?? "—", dealer:dealer?.name ?? "—", purchaseType:row.purchase_type, status:row.status, applicationCreatedAt:app?.created_at ?? "", consentAt:app?.oneid_consent_confirmed_at ?? "", submittedAt:app?.submitted_at ?? "", applicationStatus:app?.status ?? "—" });
    }
    return result;
  }
}
