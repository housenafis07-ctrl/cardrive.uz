import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string;mediaId:string}>};
export async function DELETE(_req:Request,{params}:Ctx){
 const customer=await getCurrentCustomer();
 if(!customer)return NextResponse.json({error:"Avval tizimga kiring."},{status:401});
 const {id,mediaId}=await params;const db=createServiceRoleClient();
 const item=await db.from("used_car_listing_media").select("id,storage_path").eq("id",mediaId).eq("listing_id",id)
 .eq("owner_profile_id",customer.id).in("status",["pending_review","approved","rejected"]).maybeSingle();
 if(!item.data)return NextResponse.json({error:"Video topilmadi."},{status:404});
 const removed=await db.storage.from("used-car-videos").remove([item.data.storage_path]);
 if(removed.error)return NextResponse.json({error:"Video faylini o'chirib bo'lmadi."},{status:500});
 const deleted=await db.from("used_car_listing_media").delete().eq("id",mediaId);
 if(deleted.error)return NextResponse.json({error:"Video ma'lumotini o'chirib bo'lmadi."},{status:500});
 return NextResponse.json({ok:true});
}
