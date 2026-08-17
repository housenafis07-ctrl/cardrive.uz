import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type TopCarRow = {
  car_id: string | null;
  total_amount: number | null;
  cars: { id: string; name?: string | null; name_uz?: string | null; name_ru?: string | null } | { id: string; name?: string | null; name_uz?: string | null; name_ru?: string | null }[] | null;
};

export type DashboardStats = {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  newOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  newCustomers: number;
  soldCars: number;
  totalSales: number;
  topCars: { id: string; name: string; count: number; sales: number }[];
  statusCounts: Record<string, number>;
};

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); }

export class AdminAnalyticsRepository {
  private db() { return createServiceRoleClient(); }
  async dashboard(): Promise<DashboardStats> {
    const db = this.db(); const today = startOfToday(); const month = startOfMonth();
    const [all, todayQ, monthQ, pendingQ, confirmedQ, cancelledQ, customersQ, newCustomersQ, soldQ, salesQ, statusQ, topCarsQ] = await Promise.all([
      db.from("orders").select("id", { count: "exact", head: true }),
      db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
      db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", month),
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", month),
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
      db.from("orders").select("total_amount").eq("status", "completed"),
      db.from("orders").select("status"),
      db.from("orders").select("car_id,total_amount,cars(id,name,name_uz,name_ru)").eq("status", "completed"),
    ]);
    const totalSales = (salesQ.data ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    const grouped = new Map<string, { id: string; name: string; count: number; sales: number }>();
    const rows = (topCarsQ.data ?? []) as unknown as TopCarRow[];
    for (const row of rows) {
      const car = Array.isArray(row.cars) ? row.cars[0] : row.cars;
      if (!car?.id) continue;
      const current = grouped.get(car.id) ?? { id: car.id, name: car.name_uz || car.name_ru || car.name || "Noma'lum", count: 0, sales: 0 };
      current.count += 1; current.sales += Number(row.total_amount ?? 0); grouped.set(car.id, current);
    }
    const statusCounts: Record<string, number> = {};
    for (const row of (statusQ.data ?? []) as { status: string }[]) statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
    return { totalOrders: all.count ?? 0, todayOrders: todayQ.count ?? 0, monthOrders: monthQ.count ?? 0, newOrders: pendingQ.count ?? 0, confirmedOrders: confirmedQ.count ?? 0, cancelledOrders: cancelledQ.count ?? 0, totalCustomers: customersQ.count ?? 0, newCustomers: newCustomersQ.count ?? 0, soldCars: soldQ.count ?? 0, totalSales, topCars: [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 5), statusCounts };
  }
}
