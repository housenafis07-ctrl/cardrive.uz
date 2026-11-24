import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/supabase/server";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"So‘rov noto‘g‘ri"},{status:400})}
 if(!body||typeof body!=="object")return NextResponse.json({error:"So‘rov noto‘g‘ri"},{status:400});
 const v=body as Record<string,unknown>;
 const name=typeof v.name==="string"?v.name.trim().slice(0,120):"";
 const phone=typeof v.phone==="string"?v.phone.trim().slice(0,32):"";
 const message=typeof v.message==="string"?v.message.trim().slice(0,3000):"";
 const carName=typeof v.carName==="string"?v.carName.trim().slice(0,180):"";
 const carUrl=typeof v.carUrl==="string"&&v.carUrl.startsWith("https://cardrive.uz/")?v.carUrl:null;
 const source=carName?"new_car_advice":"website_chat";
 if(!name||!/^\+?[0-9 ()-]{7,20}$/.test(phone)||!message)return NextResponse.json({error:"Ism, telefon va xabarni to‘g‘ri kiriting"},{status:400});
 const db=createServiceRoleClient();
 const {error}=await db.from("crm_leads").insert({source,customer_name:name,phone,message,car_name:carName||null,car_url:carUrl,metadata:{origin:"cardrive_native_chat",page_title:typeof v.pageTitle==="string"?v.pageTitle.slice(0,250):null}});
 if(error){console.error("[crm-chat] insert failed",{code:error.code});return NextResponse.json({error:"Murojaat yuborilmadi. Qayta urinib ko‘ring."},{status:500});}
 return NextResponse.json({ok:true,message:"Murojaatingiz qabul qilindi. Menejerimiz siz bilan bog‘lanadi."},{status:201,headers:{"Cache-Control":"no-store"}});
}
