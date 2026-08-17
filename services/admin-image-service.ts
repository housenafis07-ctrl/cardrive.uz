import "server-only";
import { AdminImageRepository } from "@/repositories/admin-image-repository";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export class AdminImageService {
  constructor(private readonly repository = new AdminImageRepository()) {}
  list(carId: string) { return this.repository.list(carId); }
  upload(carId: string, file: File, colorId?: string | null) {
    if (!ALLOWED_TYPES.has(file.type)) throw new Error("Faqat JPG, PNG yoki WEBP formatdagi fayllar qabul qilinadi");
    if (file.size > 10 * 1024 * 1024) throw new Error("Rasm 10 MB dan kichik bo‘lishi kerak");
    return this.repository.upload(carId, file, colorId ?? null);
  }
  setPrimary(carId: string, imageId: string) { return this.repository.setPrimary(carId, imageId); }
  remove(carId: string, imageId: string) { return this.repository.remove(carId, imageId); }
}
