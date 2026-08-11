import "server-only";
import { createServiceRoleClient } from "@/supabase/server";

type SingleOrArray<T> = T | T[] | null;
type BrandRelation = { name: string; slug?: string | null };
type ModelRelation = { name: string; slug?: string | null };

type ModelRowRelations = { brands?: SingleOrArray<BrandRelation> };
type CarRowRelations = { brands?: SingleOrArray<BrandRelation>; car_models?: SingleOrArray<ModelRelation> };

type NormalizedModelRow<T extends ModelRowRelations> = Omit<T, "brands"> & { brands: BrandRelation | null };
type NormalizedCarRow<T extends CarRowRelations> = Omit<T, "brands" | "car_models"> & { brands: BrandRelation | null; car_models: ModelRelation | null };

function firstRelation<T>(relation: SingleOrArray<T> | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function normalizeModelRow<T extends ModelRowRelations>(model: T): NormalizedModelRow<T> {
  return { ...model, brands: firstRelation(model.brands) };
}

function normalizeCarRow<T extends CarRowRelations>(car: T): NormalizedCarRow<T> {
  return { ...car, brands: firstRelation(car.brands), car_models: firstRelation(car.car_models) };
}

export class AdminCatalogRepository {
  private client() {
    return createServiceRoleClient();
  }

  async counts() {
    const c = this.client();
    const [brands, models, cars, featured, available, comingSoon] = await Promise.all([
      c.from("brands").select("*", { count: "exact", head: true }),
      c.from("car_models").select("*", { count: "exact", head: true }),
      c.from("cars").select("*", { count: "exact", head: true }),
      c.from("cars").select("*", { count: "exact", head: true }).eq("is_featured", true),
      c.from("cars").select("*", { count: "exact", head: true }).eq("stock_status", "available"),
      c.from("cars").select("*", { count: "exact", head: true }).eq("stock_status", "coming_soon"),
    ]);
    return {
      brands: brands.count ?? 0,
      models: models.count ?? 0,
      cars: cars.count ?? 0,
      featured: featured.count ?? 0,
      available: available.count ?? 0,
      comingSoon: comingSoon.count ?? 0,
    };
  }

  async brands(q: string, page: number) {
    let query = this.client().from("brands").select("*", { count: "exact" }).order("name");
    if (q) query = query.ilike("name", "%" + q.replace(/[,%()]/g, "") + "%");
    return query.range((page - 1) * 20, page * 20 - 1);
  }

  async models(q: string, page: number, brand?: string) {
    let query = this.client().from("car_models").select("*,brands(name,slug)", { count: "exact" }).order("name");
    if (q) query = query.ilike("name", "%" + q.replace(/[,%()]/g, "") + "%");
    if (brand) query = query.eq("brand_id", brand);
    const result = await query.range((page - 1) * 20, page * 20 - 1);
    return { ...result, data: result.data?.map(normalizeModelRow) ?? null };
  }

  async cars(q: string, page: number) {
    let query = this.client()
      .from("cars")
      .select("id,name,slug,price,currency,year,stock_status,is_active,is_featured,brands(name),car_models(name)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) query = query.ilike("name", "%" + q.replace(/[,%()]/g, "") + "%");
    const result = await query.range((page - 1) * 20, page * 20 - 1);
    return { ...result, data: result.data?.map(normalizeCarRow) ?? null };
  }

  async createBrand(input: Record<string, unknown>) {
    return this.client().from("brands").insert({ name: input.name, slug: input.slug, description: input.description, logo_url: input.logoUrl, is_active: input.isActive }).select().single();
  }

  async updateBrand(id: string, input: Record<string, unknown>) {
    return this.client().from("brands").update({ name: input.name, slug: input.slug, description: input.description, logo_url: input.logoUrl, is_active: input.isActive }).eq("id", id).select().single();
  }

  async createModel(input: Record<string, unknown>) {
    return this.client().from("car_models").insert({ brand_id: input.brandId, name: input.name, slug: input.slug, description: input.description, is_active: input.isActive }).select().single();
  }

  async updateModel(id: string, input: Record<string, unknown>) {
    return this.client().from("car_models").update({ brand_id: input.brandId, name: input.name, slug: input.slug, description: input.description, is_active: input.isActive }).eq("id", id).select().single();
  }

  async createCar(input: Record<string, unknown>) {
    return this.client()
      .from("cars")
      .insert({
        brand_id: input.brandId,
        model_id: input.modelId,
        name: input.name,
        slug: input.slug,
        short_description: input.shortDescription,
        description: input.description,
        price: input.price,
        currency: input.currency,
        old_price: input.oldPrice,
        year: input.year,
        body_type: input.bodyType,
        fuel_type: input.fuelType,
        transmission: input.transmission,
        drive_type: input.driveType,
        engine_volume: input.engineVolume,
        engine_power: input.enginePower,
        range_km: input.rangeKm,
        seats: input.seats,
        color: input.color,
        stock_status: input.stockStatus,
        is_featured: input.isFeatured,
        is_active: input.isActive,
      })
      .select()
      .single();
  }

  async deactivate(table: "brands" | "car_models" | "cars", id: string) {
    return this.client().from(table).update({ is_active: false }).eq("id", id);
  }

  async audit(actorId: string, action: string, entityType: string, entityId: string) {
    return this.client().from("audit_logs").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, metadata: {} });
  }
}
