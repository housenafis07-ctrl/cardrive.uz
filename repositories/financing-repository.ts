import "server-only";
import { createPublicServerClient } from "@/supabase/public-server";

const BANK_SELECT = "id,name,name_ru,code,logo_url,website_url,integration_status,display_order,phone,description";
const PROGRAM_SELECT = "*,financing_type:type,annual_interest_rate:interest_rate,min_down_payment_percent:down_payment_percent,display_order:sort_order,banks(id,name,name_ru,code,logo_url,website_url,integration_status,display_order,phone,description),financing_program_dealers(dealer_id),financing_program_cars(car_id)";
const RULE_SELECT = "id,financing_program_id,down_payment_percent,term_months,annual_interest_rate,is_available,display_order";

export class FinancingRepository {
  async getActiveBanks() {
    return createPublicServerClient().from("banks").select(BANK_SELECT).eq("is_active", true).neq("integration_status", "disabled").order("display_order", { ascending: true }).order("name", { ascending: true });
  }

  async getApplicableProgramsForCar(carId: string) {
    const client=createPublicServerClient();
    const carResult=await client.from("cars").select("id,brand_id,model_id,price,dealer_id").eq("id",carId).maybeSingle();
    if(!carResult.data)return{data:[],error:null};
    const car=carResult.data;
    const result=await client.from("financing_programs").select(PROGRAM_SELECT).eq("is_active",true)
      .or(`applicable_brand_id.is.null,applicable_brand_id.eq.${car.brand_id}`).or(`applicable_model_id.is.null,applicable_model_id.eq.${car.model_id}`)
      .or(`min_car_price.is.null,min_car_price.lte.${car.price}`).or(`max_car_price.is.null,max_car_price.gte.${car.price}`)
      .order("sort_order",{ascending:true}).order("name",{ascending:true});
    if(result.error||!result.data)return result;

    const programIds=result.data.map(program=>program.id);
    const rulesResult=programIds.length
      ? await client.from("financing_program_rules").select(RULE_SELECT).in("financing_program_id",programIds).eq("is_available",true).order("display_order",{ascending:true}).order("down_payment_percent",{ascending:true}).order("term_months",{ascending:true})
      : {data:[],error:null};
    if(rulesResult.error)return{...result,data:[],error:rulesResult.error};

    const rulesByProgram=new Map<string,typeof rulesResult.data>();
    for(const rule of rulesResult.data??[]){
      const current=rulesByProgram.get(rule.financing_program_id)??[];
      current.push(rule);
      rulesByProgram.set(rule.financing_program_id,current);
    }

    const data=result.data.map(program=>{
      const minTerm=Number(program.min_term_months??program.term_months??12);
      const maxTerm=Number(program.max_term_months??program.term_months??minTerm);
      const rules=rulesByProgram.get(program.id)??[];
      return {...program,min_term_months:minTerm,max_term_months:Math.max(minTerm,maxTerm),financing_program_rules:rules};
    }).filter(program=>{
      const dealerLinks=Array.isArray(program.financing_program_dealers)?program.financing_program_dealers:[];
      const carLinks=Array.isArray(program.financing_program_cars)?program.financing_program_cars:[];
      const dealerMatches=dealerLinks.length===0||Boolean(car.dealer_id&&dealerLinks.some((link:{dealer_id:string})=>link.dealer_id===car.dealer_id));
      const carMatches=carLinks.length===0||carLinks.some((link:{car_id:string})=>link.car_id===carId);
      return dealerMatches&&carMatches;
    });
    return {...result,data};
  }

  async getProgramById(id:string){
    const client=createPublicServerClient();
    const result=await client.from("financing_programs").select(PROGRAM_SELECT).eq("id",id).eq("is_active",true).maybeSingle();
    if(result.error||!result.data)return result;
    const rulesResult=await client.from("financing_program_rules").select(RULE_SELECT).eq("financing_program_id",id).eq("is_available",true).order("display_order",{ascending:true}).order("down_payment_percent",{ascending:true}).order("term_months",{ascending:true});
    return {...result,data:{...result.data,financing_program_rules:rulesResult.data??[]}};
  }
}