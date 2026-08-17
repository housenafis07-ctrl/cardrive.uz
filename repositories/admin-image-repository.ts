import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
export class AdminImageRepository {
  private client() { return createServiceRoleClient(); }
  async list(carId: string) {
    return this.client().from("car_images").select("*,car_colors(name_uz,name_ru,hex_code)").eq("car_id", carId).order("is_primary", { ascending: false }).order("sort_order");
  }
  async upload(carId: string, file: File, colorId: string | null) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = "cars/" + carId + "/" + crypto.randomUUID() + "-" + safeName;
    const client = this.client();
    const upload = await client.storage.from("car-images").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) return { error: upload.error };
    const { data } = client.storage.from("car-images").getPublicUrl(path);
    const existing = await client.from("car_images").select("sort_order").eq("car_id", carId).eq(colorId ? "color_id" : "car_id", colorId ?? carId);
    const rows = existing.data ?? [];
    const allImages = await client.from("car_images").select("sort_order").eq("car_id", carId);
    const isFirstForColor = rows.length === 0;
    const isFirstOverall = (allImages.data ?? []).length === 0;
    const nextSortOrder = isFirstForColor ? (rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0) : 0;
    return client.from("car_images").insert({ car_id: carId, color_id: colorId, storage_path: path, public_url: data.publicUrl, alt_text: null, sort_order: nextSortOrder, is_primary: isFirstOverall }).select().single();
  }
  async setPrimary(carId: string, imageId: string) {
    const client = this.client();
    const current = await client.from("car_images").select("color_id").eq("id", imageId).eq("car_id", carId).single();
    if (current.error || !current.data) return { error: current.error ?? new Error("Rasm topilmadi") };
    let query = client.from("car_images").update({ is_primary: false }).eq("car_id", carId);
    query = current.data.color_id ? query.eq("color_id", current.data.color_id) : query.is("color_id", null);
    await query;
    return client.from("car_images").update({ is_primary: true }).eq("id", imageId).eq("car_id", carId);
  }
  async remove(carId: string, imageId: string) {
    const client = this.client();
    const current = await client.from("car_images").select("storage_path").eq("id", imageId).eq("car_id", carId).single();
    if (current.data) await client.storage.from("car-images").remove([current.data.storage_path]);
    return client.from("car_images").delete().eq("id", imageId).eq("car_id", carId);
  }
}
