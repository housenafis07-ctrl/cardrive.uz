import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";
import { getServerEnv, getSupabasePublicKey } from "@/lib/env";
export const runtime = "nodejs";
const BUCKET = "used-car-videos";
const MAX = 50 * 1024 * 1024;
const TYPES = new Set(["video/mp4", "video/quicktime"]);
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
 const customer=await getCurrentCustomer();
 if(!customer) return NextResponse.json({error:"Avval tizimga kiring."},{status:401});
 const {id}=await params; const db=createServiceRoleClient();
 const own=await db.from("used_car_listings").select("id").eq("id",id).eq("owner_profile_id",customer.id).maybeSingle();
 if(!own.data) return NextResponse.json({error:"E'lon topilmadi."},{status:404});
 const result=await db.from("used_car_listing_media").select("id,original_name,size_bytes,status,moderation_note,storage_path")
 .eq("listing_id",id).eq("owner_profile_id",customer.id).neq("status","pending_upload").order("created_at");
 if(result.error) return NextResponse.json({error:"Videolarni olishda xatolik."},{status:500});
 const media=await Promise.all((result.data??[]).map(async item=>{
  if(item.status!=="approved") return {...item,playbackUrl:null};
  const signed=await db.storage.from(BUCKET).createSignedUrl(item.storage_path,1800);
  return {...item,playbackUrl:signed.data?.signedUrl??null};
 }));
 return NextResponse.json({media});
}
export async function POST(req: Request,{params}:Ctx) {
 const customer=await getCurrentCustomer();
 if(!customer) return NextResponse.json({error:"Avval tizimga kiring."},{status:401});
 let body:{name?:string;type?:string;size?:number};
 try{body=await req.json();}catch{return NextResponse.json({error:"Noto'g'ri so'rov."},{status:400});}
 const name=typeof body.name==="string"?body.name.slice(0,180):"";
 const type=typeof body.type==="string"?body.type:""; const size=Number(body.size);
 if(!name||!TYPES.has(type)||!Number.isInteger(size)||size<1||size>MAX)
  return NextResponse.json({error:"Faqat MP4/MOV, 50 MB gacha."},{status:400});
 const {id}=await params; const db=createServiceRoleClient();
 const path=`${customer.id}/${id}/${randomUUID()}.${type==="video/mp4"?"mp4":"mov"}`;
 const reserve=await db.rpc("reserve_used_car_listing_video",{p_listing_id:id,p_owner_profile_id:customer.id,p_storage_path:path,p_original_name:name,p_mime_type:type,p_size_bytes:size});
 if(reserve.error||!reserve.data?.[0]){
  const msg=reserve.error?.message??"";
  return NextResponse.json({error:msg.includes("video_limit_reached")?"Bu e'longa 3 ta video limiti to'lgan.":"E'lon topilmadi yoki video yuklashga ruxsat yo'q."},{status:400});
 }
 const signed=await db.storage.from(BUCKET).createSignedUploadUrl(path);
 if(signed.error||!signed.data){await db.from("used_car_listing_media").delete().eq("id",reserve.data[0].media_id);return NextResponse.json({error:"Yuklash havolasini yaratib bo'lmadi."},{status:500});}
 const env=getServerEnv();
 return NextResponse.json({mediaId:reserve.data[0].media_id,path,token:signed.data.token,bucket:BUCKET,supabaseUrl:env.NEXT_PUBLIC_SUPABASE_URL,publicKey:getSupabasePublicKey(env)});
}
