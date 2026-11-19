import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string}>};
export async function POST(req:Request,{params}:Ctx){
 const customer=await getCurrentCustomer();
 if(!customer)return NextResponse.json({error:"Avval tizimga kiring."},{status:401});
 let body:{mediaId?:string};try{body=await req.json();}catch{return NextResponse.json({error:"Noto'g'ri so'rov."},{status:400});}
 const {id}=await params;const db=createServiceRoleClient();
 const item=await db.from("used_car_listing_media").select("id,storage_path,upload_expires_at")
 .eq("id",body.mediaId??"").eq("listing_id",id).eq("owner_profile_id",customer.id).eq("status","pending_upload").maybeSingle();
 if(!item.data||new Date(item.data.upload_expires_at).getTime()<Date.now())return NextResponse.json({error:"Yuklash sessiyasi tugagan."},{status:400});
 const parts=item.data.storage_path.split("/");const folder=parts.slice(0,2).join("/");const filename=parts.at(-1)!;
 const listed=await db.storage.from("used-car-videos").list(folder,{search:filename,limit:10});
 if(listed.error||!listed.data?.some(f=>f.name===filename&&Number(f.metadata?.size??0)>0))return NextResponse.json({error:"Video fayli topilmadi."},{status:400});
 const updated=await db.from("used_car_listing_media").update({status:"pending_review",updated_at:new Date().toISOString()}).eq("id",item.data.id);
 if(updated.error)return NextResponse.json({error:"Video holatini saqlab bo'lmadi."},{status:500});
 return NextResponse.json({ok:true});
}
