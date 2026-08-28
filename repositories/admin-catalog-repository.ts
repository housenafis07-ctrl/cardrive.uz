import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
type SingleOrArray<T> = T | T[] | null;
type BrandRelation = { name: string; slug?: string | null };
type ModelRelation = { name: string; slug?: string | null };
type ModelRowRelations = { brands?: SingleOrArray<BrandRelation> };
type CarRowRelations = { brands?: SingleOrArray<BrandRelation>; car_models?: SingleOrArray<ModelRelation> };
type NormalizedModelRow<T extends ModelRowRelations> = Omit<T,"brands"> & { brands: BrandRelation | null };
type NormalizedCarRow<T extends CarRowRelations> = Omit<T,"brands"|"car_models"> & { brands: BrandRelation | null; car_models: ModelRelation | null };
function firstRelation<T>(relation: SingleOrArray<T>|undefined): T|null { if(Array.isArray(relation)) return relation[0]??null; return relation??null; }
function normalizeModelRow<T extends ModelRowRelations>(model:T):NormalizedModelRow<T>{return{...model,brands:firstRelation(model.brands)}}
function normalizeCarRow<T extends CarRowRelations>(car:T):NormalizedCarRow<T>{return{...car,brands:firstRelation(car.brands),car_models:firstRelation(car.car_models)}}
function cleanTerm(value:string){return value.trim().replace(/[,%()]/g,"")}
export class AdminCatalogRepository {
 private client(){return createServiceRoleClient();}
 async counts(){const c=this.client();const[brands,models,cars,featured,available,comingSoon]=await Promise.all([c.from("brands").select("*",{count:"exact",head:true}),c.from("car_models").select("*",{count:"exact",head:true}),c.from("cars").select("*",{count:"exact",head:true}),c.from("cars").select("*",{count:"exact",head:true}).eq("is_featured",true),c.from("cars").select("*",{count:"exact",head:true}).eq("stock_status","available"),c.from("cars").select("*",{count:"exact",head:true}).eq("stock_status","coming_soon")]);return{brands:brands.count??0,models:models.count??0,cars:cars.count??0,featured:featured.count??0,available:available.count??0,comingSoon:comingSoon.count??0};}
 async brands(q:string,page:number){let query=this.client().from("brands").select("*",{count:"exact"}).order("name");if(q)query=query.ilike("name","%"+q.replace(/[,%()]/g,"")+"%");return query.range((page-1)*20,page*20-1);}
 async models(q:string,page:number,brand?:string){let query=this.client().from("car_models").select("*,brands(name,slug)",{count:"exact"}).order("name");if(q)query=query.ilike("name","%"+q.replace(/[,%()]/g,"")+"%");if(brand)query=query.eq("brand_id",brand);const result=await query.range((page-1)*20,page*20-1);return{...result,data:result.data?.map(normalizeModelRow)??null};}
 async cars(q:string,page:number){
  const c=this.client();
  let query=c.from("cars").select("id,name,slug,price,currency,year,color,stock_status,is_active,is_featured,dealer_id,brands(name),car_models(name)",{count:"exact"}).order("created_at",{ascending:false});
  const tokens=cleanTerm(q).split(/\s+/).filter(Boolean);
  if(tokens.length){
   let matchingIds:string[]|null=null;
   for(const token of tokens){
    const pattern=`%${token}%`;
    const [direct,brands,models]=await Promise.all([
      c.from("cars").select("id").or(`name.ilike.${pattern},name_uz.ilike.${pattern},name_ru.ilike.${pattern},color.ilike.${pattern}`),
      c.from("brands").select("id").or(`name.ilike.${pattern},slug.ilike.${pattern}`),
      c.from("car_models").select("id").or(`name.ilike.${pattern},slug.ilike.${pattern}`)
    ]);
    if(direct.error) return {...direct,data:null};
    if(brands.error) return {...brands,data:null};
    if(models.error) return {...models,data:null};
    const brandIds=(brands.data??[]).map(x=>x.id);
    const modelIds=(models.data??[]).map(x=>x.id);
    const related=[] as string[];
    if(brandIds.length){const r=await c.from("cars").select("id").in("brand_id",brandIds);if(r.error)return{...r,data:null};related.push(...(r.data??[]).map(x=>x.id));}
    if(modelIds.length){const r=await c.from("cars").select("id").in("model_id",modelIds);if(r.error)return{...r,data:null};related.push(...(r.data??[]).map(x=>x.id));}
    const ids=Array.from(new Set([...(direct.data??[]).map(x=>x.id),...related]));
    matchingIds=matchingIds===null?ids:matchingIds.filter(id=>ids.includes(id));
    if(!matchingIds.length){return{data:[],count:0,error:null,status:200,statusText:"OK"};}
   }
   query=query.in("id",matchingIds??[]);
  }
  const result=await query.range((page-1)*20,page*20-1);
  return{...result,data:result.data?.map(normalizeCarRow)??null};
 }
 async createBrand(input:Record<string,unknown>){return this.client().from("brands").insert({name:input.name,slug:input.slug,description:input.description,logo_url:input.logoUrl,is_active:input.isActive}).select().single();}
 async updateBrand(id:string,input:Record<string,unknown>){return this.client().from("brands").update({name:input.name,slug:input.slug,description:input.description,logo_url:input.logoUrl,is_active:input.isActive}).eq("id",id).select().single();}
 async createModel(input:Record<string,unknown>){return this.client().from("car_models").insert({brand_id:input.brandId,name:input.name,slug:input.slug,description:input.description,is_active:input.isActive}).select().single();}
 async updateModel(id:string,input:Record<string,unknown>){return this.client().from("car_models").update({brand_id:input.brandId,name:input.name,slug:input.slug,description:input.description,is_active:input.isActive}).eq("id",id).select().single();}
 async createCar(input:Record<string,unknown>){const c=this.client();const modelCheck=await c.from("car_models").select("id,brand_id").eq("id",String(input.modelId)).maybeSingle();if(modelCheck.error)throw modelCheck.error;if(!modelCheck.data)throw new Error("Tanlangan model bazada topilmadi.");if(modelCheck.data.brand_id!==String(input.brandId))throw new Error("Tanlangan model tanlangan brendga tegishli emas.");const baseSlug=String(input.slug);let slug=baseSlug;for(let suffix=2;;suffix++){const existing=await c.from("cars").select("id").eq("slug",slug).maybeSingle();if(existing.error)throw existing.error;if(!existing.data)break;slug=`${baseSlug}-${suffix}`;}return c.from("cars").insert({brand_id:input.brandId,model_id:input.modelId,dealer_id:input.dealerId??null,name:input.name,slug,short_description:input.shortDescription,description:input.description,price:input.price,currency:input.currency,old_price:input.oldPrice,year:input.year,body_type:input.bodyType,fuel_type:input.fuelType,transmission:input.transmission,drive_type:input.driveType,engine_volume:input.engineVolume,engine_type:input.engineType,engine_power:input.enginePower,range_km:input.rangeKm,battery_capacity_kwh:input.batteryCapacityKwh,acceleration_0_100_sec:input.acceleration0100Sec,charging_time_minutes:input.chargingTimeMinutes,seats:input.seats,color:input.color,stock_status:input.stockStatus,is_featured:input.isFeatured,is_active:input.isActive}).select().single();}
 async setActive(table:"brands"|"car_models"|"cars",id:string,isActive:boolean){return this.client().from(table).update({is_active:isActive}).eq("id",id);}
 async deactivate(table:"brands"|"car_models"|"cars",id:string){return this.setActive(table,id,false);}
 async audit(actorId:string,action:string,entityType:string,entityId:string){return this.client().from("audit_logs").insert({actor_id:actorId,action,entity_type:entityType,entity_id:entityId,metadata:{}});}
}
