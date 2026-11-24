import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const admin=await getAdminUser();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Faqat administrator sozlashi mumkin"},{status:403});
 const env=getServerEnv();const token=env.TELEGRAM_BOT_TOKEN,secret=env.TELEGRAM_WEBHOOK_SECRET;
 if(!token||!secret)return NextResponse.json({error:"Vercel Environment Variables’da TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET kiriting"},{status:503});
 const origin=new URL(request.url).origin;
 if(origin!=="https://cardrive.uz")return NextResponse.json({error:"Webhook faqat Production domenidan sozlanishi mumkin"},{status:400});
 const webhookUrl=origin+"/api/telegram/webhook";
 const response=await fetch("https://api.telegram.org/bot"+token+"/setWebhook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:webhookUrl,secret_token:secret,allowed_updates:["message"],drop_pending_updates:false}),cache:"no-store"});
 const result=await response.json() as {ok?:boolean;description?:string};
 if(!response.ok||!result.ok)return NextResponse.json({error:result.description??"Telegram webhook o‘rnatilmadi"},{status:502});
 return NextResponse.json({ok:true,webhookUrl,message:"Telegram webhook muvaffaqiyatli sozlandi"},{headers:{"Cache-Control":"no-store"}});
}
