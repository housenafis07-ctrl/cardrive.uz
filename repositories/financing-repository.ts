import "server-only";
import { createPublicServerClient } from "@/supabase/public-server";

type ProgramLink = { dealer_id?: string; car_id?: string };
const PROGRAM_SELECT = "*,banks(id,name,name_ru,code,logo_url,website_url,integration_status,display_order,phone,description),financing_program_dealers(dealer_id),financing_program_cars(car_id)";

export class FinancingRepository {
  async getApplicableProgramsForCar(carId: string) {
    const client = createPublicServerClient();
    const carResult = await client.from("cars").select("id,brand_id,model_id,price,dealer_id").eq("id", carId).maybeSingle();
    if (carResult.error) return { data: [], error: carResult.error };
    if (!carResult.data) return { data: [], error: null };
    const car = carResult.data;
    const result = await client.from("financing_programs").select(PROGRAM_SELECT).eq("is_active", true)
      .or(`applicable_brand_id.is.null,applicable_brand_id.eq.${car.brand_id}`)
      .or(`applicable_model_id.is.null,applicable_model_id.eq.${car.model_id}`)
      .or(`min_car_price.is.null,min_car_price.lte.${car.price}`)
      .or(`max_car_price.is.null,max_car_price.gte.${car.price}`)
      .order("sort_order", { ascending: true }).order("name", { ascending: true });
    if (result.error || !result.data) return result;
    const data = result.data.map((program) => ({
      ...program,
      min_term_months: 12,
      max_term_months: Math.max(12, Number(program.term_months ?? 12)),
    })).filter((program) => {
      const dealerLinks = (program.financing_program_dealers ?? []) as ProgramLink[];
      const carLinks = (program.financing_program_cars ?? []) as ProgramLink[];
      const dealerMatches = dealerLinks.length === 0 || Boolean(car.dealer_id && dealerLinks.some((link) => link.dealer_id === car.dealer_id));
      const carMatches = carLinks.length === 0 || carLinks.some((link) => link.car_id === carId);
      return dealerMatches && carMatches;
    });
    return { ...result, data };
  }
}
