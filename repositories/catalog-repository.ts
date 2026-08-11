import "server-only";
import { createPublicServerClient } from "@/supabase/public-server";
import { PAGE_SIZE, type CatalogQuery } from "@/features/catalog/catalog-query";

type SingleOrArray<T> = T | T[] | null;
type BrandRelation = { name: string; slug?: string | null };
type ModelRelation = { name: string; slug?: string | null };
type ImageRelation = { public_url: string | null; alt_text: string | null; is_primary: boolean; sort_order: number };
type CarRelations = {
  brands?: SingleOrArray<BrandRelation>;
  car_models?: SingleOrArray<ModelRelation>;
  car_images?: ImageRelation[] | null;
};

type NormalizedCar<T extends CarRelations> = Omit<T, "brands" | "car_models"> & {
  brands: BrandRelation | null;
  car_models: ModelRelation | null;
};

function firstRelation<T>(relation: SingleOrArray<T> | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function normalizeCar<T extends CarRelations>(car: T): NormalizedCar<T> {
  return {
    ...car,
    brands: firstRelation(car.brands),
    car_models: firstRelation(car.car_models),
  };
}

function normalizeCars<T extends CarRelations>(cars: T[] | null): Array<NormalizedCar<T>> | null {
  return cars?.map(normalizeCar) ?? null;
}

export class CatalogRepository {
  async getCars(filters: CatalogQuery) {
    const from = (filters.page - 1) * PAGE_SIZE;
    let query = createPublicServerClient()
      .from("cars")
      .select(
        "id,name,slug,price,currency,old_price,year,body_type,fuel_type,transmission,drive_type,stock_status,is_featured,brands(name,slug),car_models(name,slug),car_images(public_url,alt_text,is_primary,sort_order)",
        { count: "exact" },
      )
      .eq("is_active", true)
      .in("stock_status", filters.status ? [filters.status] : ["available", "coming_soon"]);

    if (filters.brand) query = query.eq("brands.slug", filters.brand);
    if (filters.model) query = query.eq("car_models.slug", filters.model);
    if (filters.body) query = query.eq("body_type", filters.body);
    if (filters.fuel) query = query.eq("fuel_type", filters.fuel);
    if (filters.transmission) query = query.eq("transmission", filters.transmission);
    if (filters.drive) query = query.eq("drive_type", filters.drive);
    if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
    if (filters.minYear !== undefined) query = query.gte("year", filters.minYear);
    if (filters.maxYear !== undefined) query = query.lte("year", filters.maxYear);
    if (filters.q) query = query.ilike("name", "%" + filters.q.replace(/[,%()]/g, "") + "%");

    if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
    else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
    else if (filters.sort === "newest") query = query.order("year", { ascending: false });
    else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

    const result = await query.range(from, from + PAGE_SIZE - 1);
    return { ...result, data: normalizeCars(result.data) };
  }

  async getCarBySlug(slug: string) {
    const result = await createPublicServerClient()
      .from("cars")
      .select("*,brands(name,slug),car_models(name,slug),car_images(public_url,alt_text,is_primary,sort_order)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return { ...result, data: result.data ? normalizeCar(result.data) : null };
  }

  async getFeaturedCars(limit = 4) {
    const result = await createPublicServerClient()
      .from("cars")
      .select("id,name,slug,price,currency,year,stock_status,is_featured,brands(name),car_models(name),car_images(public_url,alt_text,is_primary,sort_order)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { ...result, data: normalizeCars(result.data) };
  }

  async getAvailableCars(limit = 4) {
    const result = await createPublicServerClient()
      .from("cars")
      .select("id,name,slug,price,currency,year,stock_status,is_featured,brands(name),car_models(name),car_images(public_url,alt_text,is_primary,sort_order)")
      .eq("is_active", true)
      .eq("stock_status", "available")
      .order("created_at", { ascending: false })
      .limit(limit);
    return { ...result, data: normalizeCars(result.data) };
  }

  async getActiveBrands() {
    return createPublicServerClient().from("brands").select("id,name,slug,logo_url").eq("is_active", true).order("name");
  }

  async getModelsByBrand(brandSlug?: string) {
    let query = createPublicServerClient().from("car_models").select("id,name,slug,brand_id,brands!inner(slug)").eq("is_active", true).order("name");
    if (brandSlug) query = query.eq("brands.slug", brandSlug);
    return query;
  }

  async getBodyTypes() {
    return createPublicServerClient().from("cars").select("body_type").eq("is_active", true).not("body_type", "is", null);
  }
}
