import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createCrmClient, createServiceRoleClient } from "@/supabase/server";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
 const user=await getAdminUser(); if(!user) return NextResponse.json({error:"Ruxsat yo‘q"},{status:401});
 const {id}=await params; if(!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({error:"ID noto‘g‘ri"},{status:400});
 let body:unknown; try{body=await request.json()}catch{return NextResponse.json({error:"JSON noto‘g‘ri"},{status:400})}
 if(!body||typeof body!=="object") return NextResponse.json({error:"So‘rov noto‘g‘ri"},{status:400});
 const value=body as {status?:unknown;assignedTo?:unknown};
 const patch:Record<string,unknown>={};
 if(value.status!==undefined){if(!["new","in_progress","contacted","resolved","spam"].includes(String(value.status)))return NextResponse.json({error:"Holat noto‘g‘ri"},{status:400});patch.status=value.status;}
 if(value.assignedTo!==undefined){if(value.assignedTo!==null&&(typeof value.assignedTo!=="string"||!/^[0-9a-f-]{36}$/i.test(value.assignedTo)))return NextResponse.json({error:"Mas’ul xodim noto‘g‘ri"},{status:400});patch.assigned_to=value.assignedTo;}
 if(!Object.keys(patch).length)return NextResponse.json({error:"Yangilash uchun maydon yo‘q"},{status:400});
 const db=createCrmClient();
 if(typeof patch.assigned_to==="string"){const staff=await createServiceRoleClient().from("profiles").select("id").eq("id",patch.assigned_to).eq("is_active",true).in("role",["admin","manager"]).maybeSingle();if(!staff.data)return NextResponse.json({error:"Xodim topilmadi"},{status:400});}
 const {data,error}=await db.from("crm_leads").update(patch).eq("id",id).select("id,status,assigned_to,updated_at").maybeSingle();
 if(error)return NextResponse.json({error:"Murojaat yangilanmadi"},{status:500});
 if(!data)return NextResponse.json({error:"Murojaat topilmadi"},{status:404});
 return NextResponse.json({lead:data},{headers:{"Cache-Control":"no-store"}});
}
