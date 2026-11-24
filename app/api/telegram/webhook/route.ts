import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { createCrmClient } from "@/supabase/server";
export const dynamic="force-dynamic";
const MINI_APP_URL="https://cardrive.uz";
type TelegramUpdate={update_id?:number;message?:{message_id?:number;date?:number;text?:string;chat?:{id?:number;type?:string};from?:{id?:number;first_name?:string;last_name?:string;username?:string};contact?:{phone_number?:string;first_name?:string;last_name?:string;user_id?:number}}};
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
const keyboard={keyboard:[[{text:"🚗 Cardrive Mini App",web_app:{url:MINI_APP_URL}}],[{text:"📞 Telefon raqamimni yuborish",request_contact:true}]],resize_keyboard:true,is_persistent:true};
const welcome=`Assalomu alaykum, {name}! 👋
Cardrive’ga xush kelibsiz!

🚘 Cardrive — yangi va ishlatilgan avtomobillarni topish, taqqoslash hamda xarid uchun moliyalashtirish imkoniyatlari bilan tanishish platformasi.

📱 Qanday foydalaniladi?
1. “🚗 Cardrive Mini App” tugmasini bosing.
2. Yangi avtomobillar yoki Avtobozor bo‘limini tanlang.
3. Marka, model, narx va boshqa mezonlar bo‘yicha qidiring.
4. Avtomobil sahifasida rasmlar, tavsif va mavjud moliyalashtirish shartlarini ko‘ring.
5. Savolingiz bo‘lsa, shu botga xabar yozing yoki telefon raqamingizni yuboring — menejerimiz siz bilan bog‘lanadi.

💬 Murojaatingiz shu yerning o‘zida qabul qilinadi.
👇 Ilovani ochish yoki telefon raqamingizni yuborish uchun quyidagi tugmalardan foydalaning.`;
const help=`Cardrive’dan foydalanish:
🚗 Mini App — avtomobillar katalogi va Avtobozorni ochadi.
🔎 Qidiruv va filtrlar — kerakli avtomobilni topishga yordam beradi.
📄 Avtomobil sahifasi — narx, tavsif va moliyalashtirish ma’lumotlarini ko‘rsatadi.
💬 Murojaat — shu chatga savolingizni yozing.
📞 Telefon — “Telefon raqamimni yuborish” tugmasini bosing, menejer sizga aloqaga chiqadi.

Ilovani ochish uchun “🚗 Cardrive Mini App” tugmasini bosing.`;
async function sendMessage(token:string,chatId:number,text:string,withKeyboard=true){const response=await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text,reply_markup:withKeyboard?keyboard:undefined}),cache:"no-store"});if(!response.ok)console.error("[telegram-webhook] sendMessage failed",{status:response.status});}
export async function POST(request:Request){
 const env=getServerEnv();const token=env.TELEGRAM_BOT_TOKEN,secret=env.TELEGRAM_WEBHOOK_SECRET;
 if(!token||!secret)return NextResponse.json({error:"Telegram webhook sozlanmagan"},{status:503});
 const provided=request.headers.get("x-telegram-bot-api-secret-token")??"";
 if(!safeEqual(provided,secret))return NextResponse.json({error:"Ruxsat yo‘q"},{status:401});
 let update:TelegramUpdate;try{update=await request.json() as TelegramUpdate}catch{return NextResponse.json({error:"JSON noto‘g‘ri"},{status:400})}
 const m=update.message,chatId=m?.chat?.id,messageId=m?.message_id,from=m?.from;
 if(!m||!chatId||!messageId||!from?.id)return NextResponse.json({ok:true});
 const text=(m.text??"").trim().slice(0,4000),contact=m.contact;
 const isCommand=/^\/(start|help|app)(?:@\w+)?(?:\s|$)/i.test(text);
 if(text==="/start"||/^\/start(?:@\w+)?(?:\s|$)/i.test(text)){
  const firstName=(from.first_name??"").trim()||"do‘stimiz";
  await sendMessage(token,chatId,welcome.replace("{name}",firstName));
 }else if(/^\/help(?:@\w+)?(?:\s|$)/i.test(text)){
  await sendMessage(token,chatId,help);
 }else if(/^\/app(?:@\w+)?(?:\s|$)/i.test(text)||text==="🚗 Cardrive Mini App"){
  await sendMessage(token,chatId,"Cardrive ilovasini ochish uchun quyidagi tugmani bosing. 🚗");
 }else if(contact){
  const db=createCrmClient();
  const name=[contact.first_name??from.first_name,contact.last_name??from.last_name].filter(Boolean).join(" ").slice(0,160)||null;
  const {error}=await db.from("crm_leads").upsert({source:"telegram",external_id:String(chatId)+":"+String(messageId),customer_name:name,phone:contact.phone_number??null,telegram_username:from.username??null,message:"Mijoz telefon raqamini yubordi.",metadata:{chat_id:String(chatId),telegram_user_id:String(from.id),update_id:update.update_id??null,message_date:m.date??null,contact_shared:true}},{onConflict:"source,external_id",ignoreDuplicates:true});
  if(error){console.error("[telegram-webhook] contact save failed",{code:error.code});await sendMessage(token,chatId,"Telefon raqamingizni saqlashda xatolik yuz berdi. Iltimos, birozdan keyin qayta urinib ko‘ring.");return NextResponse.json({ok:true});}
  await sendMessage(token,chatId,"Rahmat! 📞 Telefon raqamingiz qabul qilindi. Cardrive menejeri tez orada siz bilan bog‘lanadi.");
 }else if(text&&!isCommand){
  const db=createCrmClient();
  const name=[from.first_name,from.last_name].filter(Boolean).join(" ").slice(0,160)||null;
  const {error}=await db.from("crm_leads").upsert({source:"telegram",external_id:String(chatId)+":"+String(messageId),customer_name:name,telegram_username:from.username??null,message:text,metadata:{chat_id:String(chatId),telegram_user_id:String(from.id),update_id:update.update_id??null,message_date:m.date??null}},{onConflict:"source,external_id",ignoreDuplicates:true});
  if(error){console.error("[telegram-webhook] CRM insert failed",{code:error.code});await sendMessage(token,chatId,"Xabaringizni saqlashda xatolik yuz berdi. Iltimos, qayta yuboring.");return NextResponse.json({ok:true});}
  await sendMessage(token,chatId,"Xabaringiz qabul qilindi. ✅ Cardrive menejeri siz bilan bog‘lanadi. Qo‘shimcha ma’lumot uchun telefon raqamingizni ham yuborishingiz mumkin.");
 }
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
