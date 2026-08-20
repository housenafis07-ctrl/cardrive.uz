import "server-only";
import { CatalogRepository } from "@/repositories/catalog-repository";
import { catalogQuerySchema } from "@/features/catalog/catalog-query";

export class CatalogService {
  constructor(private readonly repository = new CatalogRepository()) {}
  getCars(input: Record<string, string | string[] | undefined>) { return this.repository.getCars(catalogQuerySchema.parse(input)); }
  getCarBySlug(slug: string) { return this.repository.getCarBySlug(slug); }
  getFeaturedCars(limit = 12) { return this.repository.getFeaturedCars(limit); }
  getAvailableCars(limit = 12) { return this.repository.getAvailableCars(limit); }
  getActiveBrands() { return this.repository.getActiveBrands(); }
  getModelsByBrand(brand?: string) { return this.repository.getModelsByBrand(brand); }
  getBodyTypes() { return this.repository.getBodyTypes(); }
  getHomeCategories() { return this.repository.getHomeCategories(); }
  getHomeBanners() { return this.repository.getHomeBanners(); }
  getModelModifications(modelId: string, excludeCarId?: string) { return this.repository.getModelModifications(modelId, excludeCarId); }
}
