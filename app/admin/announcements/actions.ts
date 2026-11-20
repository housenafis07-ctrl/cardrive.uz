"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
const val=(fd:FormData,k:string)=>{const v=fd.get(k);return typeof v==="string"&&v.trim()?v.trim():null};
const num=(fd:FormData,k:string)=>Number.parseInt(val(fd,k)??"0",10)||0;
const date=(fd:FormData,k:string)=>{const v=val(fd,k);return v?new Date(v).toISOString():null};
export async function saveAnnouncementAction(fd:FormData){
 await requireAdminUser();const id=val(fd,"id"),kind=val(fd,"kind"),title=val(fd,"titleUz"),href=val(fd,"href");
 if(!title||(kind!=="news"&&kind!=="announcement"))redirect("/admin/announcements?error=Majburiy+maydonlarni+tekshiring");
 if(href&&!href.startsWith("/"))redirect("/admin/announcements?error=Havola+sayt+ichidagi+manzil+bo‘lishi+kerak");
 const payload={kind,title_uz:title,title_ru:val(fd,"titleRu"),href,sort_order:num(fd,"sortOrder"),is_active:fd.get("isActive")==="on",starts_at:date(fd,"startsAt"),ends_at:date(fd,"endsAt"),updated_at:new Date().toISOString()};
 const c=createServiceRoleClient();const result=id?await c.from("site_announcements").update(payload).eq("id",id):await c.from("site_announcements").insert(payload);
 if(result.error)redirect("/admin/announcements?error="+encodeURIComponent(result.error.message));
 revalidatePath("/admin/announcements");revalidatePath("/");redirect("/admin/announcements?saved=1");
}
export async function toggleAnnouncementAction(fd:FormData){await requireAdminUser();const id=val(fd,"id");if(!id)throw new Error("Xabar topilmadi");const c=createServiceRoleClient();await c.from("site_announcements").update({is_active:fd.get("isActive")==="on",updated_at:new Date().toISOString()}).eq("id",id);revalidatePath("/admin/announcements");revalidatePath("/");}
export async function deleteAnnouncementAction(fd:FormData){await requireAdminUser();const id=val(fd,"id");if(!id)throw new Error("Xabar topilmadi");const c=createServiceRoleClient();await c.from("site_announcements").delete().eq("id",id);revalidatePath("/admin/announcements");revalidatePath("/");}
