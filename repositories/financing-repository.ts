import "server-only";
import { createPublicServerClient } from "@/supabase/public-server";

const BANK_SELECT = "id,name,name_ru,code,logo_url,website_url,integration_status,is_active,display_order,phone,description";
const PROGRAM_SELECT = "*,financing_type:type,annual_interest_rate:interest_rate,min_down_payment_percent:down_payment_percent,display_order:sort_order,banks(id,name,name_ru,code,logo_url,website_url,integration_status,is_active,display_order,phone,description),financing_program_dealers(dealer_id),financing_program_cars(car_id)";
const RULE_SELECT = "id,financing_program_id,down_payment_percent,term_months,annual_interest_rate,is_available,display_order";

type ProgramLink = { dealer_id?: string; car_id?: string };

export class FinancingRepository {
  async getActiveBanks() {
    return createPublicServerClient().from("banks").select(BANK_SELECT).eq("is_active", true).neq("integration_status", "disabled").order("display_order", { ascending: true }).order("name", { ascending: true });
  }

  async getActiveProgramsWithCars() {
    const client = createPublicServerClient();
    const programsResult = await client.from("financing_programs").select(PROGRAM_SELECT).eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true });
    if (programsResult.error || !programsResult.data?.length) return programsResult;
    const ids = programsResult.data.map((program) => program.id);
    const linksResult = await client.from("financing_program_cars").select("financing_program_id,car_id").in("financing_program_id", ids);
    if (linksResult.error) return { ...programsResult, data: null, error: linksResult.error };
    const carIds = [...new Set((linksResult.data ?? []).map((link) => link.car_id))];
    if (!carIds.length) return { ...programsResult, data: programsResult.data.map((program) => ({ ...program, linked_cars: [] })) };
    const carsResult = await client.from("cars").select("id,slug,name,name_uz,name_ru,price,currency,year,stock_status,is_active,brands(name,name_uz,name_ru,slug,logo_url),car_models(name,name_uz,name_ru,slug)").in("id", carIds).eq("is_active", true).order("name", { ascending: true });
    if (carsResult.error) return { ...programsResult, data: null, error: carsResult.error };
    const carsById = new Map((carsResult.data ?? []).map((car) => [car.id, car]));
    const linksByProgram = new Map<string, string[]>();
    for (const link of linksResult.data ?? []) linksByProgram.set(link.financing_program_id, [...(linksByProgram.get(link.financing_program_id) ?? []), link.car_id]);
    return { ...programsResult, data: programsResult.data.map((program) => ({ ...program, linked_cars: (linksByProgram.get(program.id) ?? []).map((id) => carsById.get(id)).filter(Boolean) })) };
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

    const enriched=result.data.map(program=>{
      const minTerm=Number(program.min_term_months??program.term_months??12);
      const maxTerm=Number(program.max_term_months??program.term_months??minTerm);
      const rules=rulesByProgram.get(program.id)??[];
      const dealerLinks=(Array.isArray(program.financing_program_dealers)?program.financing_program_dealers:[]) as ProgramLink[];
      const carLinks=(Array.isArray(program.financing_program_cars)?program.financing_program_cars:[]) as ProgramLink[];
      const carLinked=carLinks.some(link=>link.car_id===carId);
      const dealerLinked=dealerLinks.length>0&&Boolean(car.dealer_id&&dealerLinks.some(link=>link.dealer_id===car.dealer_id));
      const modelSpecific=program.applicable_model_id===car.model_id;
      const brandSpecific=program.applicable_brand_id===car.brand_id;
      const specificity=carLinked?4:modelSpecific?3:brandSpecific?2:(dealerLinked?1:0);
      const applicable=carLinks.length===0||carLinked;
      const dealerApplicable=dealerLinks.length===0||dealerLinked;
      return {...program,min_term_months:minTerm,max_term_months:Math.max(minTerm,maxTerm),financing_program_rules:rules,_specificity:specificity,_applicable:applicable&&dealerApplicable};
    }).filter(program=>program._applicable);

    const highestSpecificity=enriched.reduce((max,program)=>Math.max(max,program._specificity),0);
    const data=enriched.filter(program=>program._specificity===highestSpecificity).map(({_specificity,_applicable,...program})=>program);
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