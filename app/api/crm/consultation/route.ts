import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/supabase/server";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"So‘rov noto‘g‘ri"},{status:400})}
 if(!body||typeof body!=="object")return NextResponse.json({error:"So‘rov noto‘g‘ri"},{status:400});
 const v=body as Record<string,unknown>;
 const carName=typeof v.carName==="string"?v.carName.trim().slice(0,180):"";
 const carUrl=typeof v.carUrl==="string"&&v.carUrl.startsWith("https://cardrive.uz/")?v.carUrl:"";
 const brandName=typeof v.brandName==="string"?v.brandName.trim().slice(0,100):"";
 if(!carName||!carUrl)return NextResponse.json({error:"Avtomobil ma’lumoti yetarli emas"},{status:400});
 const db=createServiceRoleClient();
 const {error}=await db.from("crm_leads").insert({source:"new_car_advice",car_name:[brandName,carName].filter(Boolean).join(" "),car_url:carUrl,message:"Saytdagi «Maslahat olish» tugmasi bosildi. Mijoz Jivo chatida suhbatni davom ettiradi.",metadata:{page_title:typeof v.pageTitle==="string"?v.pageTitle.slice(0,250):null}});
 if(error){console.error("[crm-consultation] insert failed",{code:error.code});return NextResponse.json({error:"Murojaat qayd etilmadi"},{status:500});}
 return NextResponse.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
}
