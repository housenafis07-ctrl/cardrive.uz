import "server-only";
import { createPublicServerClient } from "@/supabase/public-server";
const BANK_SELECT = "id,name,code,logo_url,website_url,integration_status,display_order";
const PROGRAM_WITH_BANK_SELECT = "*, banks!inner(id,name,code,logo_url,website_url,integration_status,display_order)";
export class FinancingRepository {
  async getActiveBanks() { return createPublicServerClient().from("banks").select(BANK_SELECT).eq("is_active", true).neq("integration_status", "disabled").order("display_order", { ascending: true }).order("name", { ascending: true }); }
  async getApplicableProgramsForCar(carId: string) { const client = createPublicServerClient(); const carResult = await client.from("cars").select("id,brand_id,model_id,price").eq("id", carId).maybeSingle(); if (!carResult.data) return { data: [], error: null }; const car = carResult.data; return client.from("financing_programs").select(PROGRAM_WITH_BANK_SELECT).eq("is_active", true).or(`applicable_brand_id.is.null,applicable_brand_id.eq.${car.brand_id}`).or(`applicable_model_id.is.null,applicable_model_id.eq.${car.model_id}`).or(`min_car_price.is.null,min_car_price.lte.${car.price}`).or(`max_car_price.is.null,max_car_price.gte.${car.price}`).order("display_order", { referencedTable: "banks", ascending: true }).order("display_order", { ascending: true }).order("name", { ascending: true }); }
  async getProgramById(id: string) { return createPublicServerClient().from("financing_programs").select(PROGRAM_WITH_BANK_SELECT).eq("id", id).eq("is_active", true).maybeSingle(); }
}
