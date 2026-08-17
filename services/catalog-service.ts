import "server-only";
import { CatalogRepository } from "@/repositories/catalog-repository";
import { catalogQuerySchema } from "@/features/catalog/catalog-query";

export class CatalogService {
  constructor(private readonly repository = new CatalogRepository()) {}
  getCars(input: Record<string, string | string[] | undefined>) { return this.repository.getCars(catalogQuerySchema.parse(input)); }
  getCarBySlug(slug: string) { return this.repository.getCarBySlug(slug); }
  getFeaturedCars() { return this.repository.getFeaturedCars(); }
  getAvailableCars() { return this.repository.getAvailableCars(); }
  getActiveBrands() { return this.repository.getActiveBrands(); }
  getModelsByBrand(brand?: string) { return this.repository.getModelsByBrand(brand); }
  getBodyTypes() { return this.repository.getBodyTypes(); }
  getHomeCategories() { return this.repository.getHomeCategories(); }
  getHomeBanners() { return this.repository.getHomeBanners(); }
}
