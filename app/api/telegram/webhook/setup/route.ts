import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
export const dynamic="force-dynamic";
const MINI_APP_URL="https://cardrive.uz";
async function telegramCall(token:string,method:string,payload:Record<string,unknown>){const response=await fetch("https://api.telegram.org/bot"+token+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});const result=await response.json() as {ok?:boolean;description?:string};return{ok:response.ok&&result.ok===true,description:result.description};}
export async function POST(request:Request){
 const admin=await getAdminUser();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Faqat administrator sozlashi mumkin"},{status:403});
 const env=getServerEnv();const token=env.TELEGRAM_BOT_TOKEN,secret=env.TELEGRAM_WEBHOOK_SECRET;
 if(!token||!secret)return NextResponse.json({error:"Vercel Environment Variables’da TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET kiriting"},{status:503});
 const origin=new URL(request.url).origin;
 if(origin!=="https://cardrive.uz")return NextResponse.json({error:"Webhook faqat Production domenidan sozlanishi mumkin"},{status:400});
 const webhookUrl=origin+"/api/telegram/webhook";
 const webhook=await telegramCall(token,"setWebhook",{url:webhookUrl,secret_token:secret,allowed_updates:["message"],drop_pending_updates:false});
 if(!webhook.ok)return NextResponse.json({error:webhook.description??"Telegram webhook o‘rnatilmadi"},{status:502});
 const menu=await telegramCall(token,"setChatMenuButton",{menu_button:{type:"web_app",text:"Cardrive ilovasi",web_app:{url:MINI_APP_URL}}});
 if(!menu.ok)return NextResponse.json({ok:true,webhookUrl,warning:"Webhook ulandi, lekin Mini App menyu tugmasi sozlanmadi: "+(menu.description??"Telegram API xatosi")},{headers:{"Cache-Control":"no-store"}});
 return NextResponse.json({ok:true,webhookUrl,miniAppUrl:MINI_APP_URL,message:"Telegram bot, Mini App menyu tugmasi muvaffaqiyatli sozlandi"},{headers:{"Cache-Control":"no-store"}});
}
