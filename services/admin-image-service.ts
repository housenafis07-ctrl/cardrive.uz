import "server-only";
import { AdminImageRepository } from "@/repositories/admin-image-repository";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TYPE_BY_EXT: Record<string,string> = { jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp" };
export class AdminImageService {
  constructor(private readonly repository = new AdminImageRepository()) {}
  list(carId: string) { return this.repository.list(carId); }
  upload(carId: string, file: File, colorId?: string | null) {
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    const contentType = ALLOWED_TYPES.has(file.type) ? file.type : TYPE_BY_EXT[ext];
    if (!contentType) throw new Error("Faqat JPG, PNG yoki WEBP formatdagi fayllar qabul qilinadi");
    if (file.size > 10 * 1024 * 1024) throw new Error("Rasm 10 MB dan kichik bo‘lishi kerak");
    const normalizedFile = file.type === contentType ? file : new File([file], file.name, { type: contentType });
    return this.repository.upload(carId, normalizedFile, colorId ?? null);
  }
  setPrimary(carId: string, imageId: string) { return this.repository.setPrimary(carId, imageId); }
  remove(carId: string, imageId: string) { return this.repository.remove(carId, imageId); }
}
