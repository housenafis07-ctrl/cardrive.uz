"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createPublicServerClient } from "@/supabase/public-server";
import { createServiceRoleClient } from "@/supabase/server";
import { FinancingService } from "@/services/financing-service";
import { randomUUID } from "node:crypto";

const text=(fd:FormData,key:string)=>{const v=fd.get(key);return typeof v==="string"?v.trim():"";};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money=(v:number)=>Number.isFinite(v)&&v>=0;
async function validateImage(file:File,label:string){
 if(!(file instanceof File)||!file.size||file.size>5*1024*1024)throw new Error(label+": rasm 5 MB dan kichik bo‘lishi kerak.");
 const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const mime=b[0]===255&&b[1]===216&&b[2]===255?"image/jpeg":b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71?"image/png":b[0]===82&&b[1]===73&&b[2]===70&&b[3]===70&&b[8]===87&&b[9]===69&&b[10]===66&&b[11]===80?"image/webp":null;
 if(!mime||file.type!==mime)throw new Error(label+": faqat haqiqiy JPG, PNG yoki WEBP rasm qabul qilinadi.");
}
function monthlyPayment(principal:number,rate:number,months:number){const r=rate/1200;if(!months)return 0;return Math.round(r===0?principal/months:principal*r/(1-Math.pow(1+r,-months)));}
export async function submitUsedCarCreditApplication(fd:FormData):Promise<{ok:true;id:string}|{ok:false;message:string}>{
 const customer=await getCurrentCustomer();
 if(!customer)return{ok:false,message:"Ariza yuborish uchun avval telefon raqamingiz orqali tizimga kiring."};
 const listingId=text(fd,"listingId"),programId=text(fd,"programId"),phoneInput=text(fd,"phone");
 const phoneDigits=phoneInput.replace(/\D/g,"");
 const phone=phoneDigits.length===9?"+998"+phoneDigits:phoneDigits.startsWith("998")?"+"+phoneDigits:"";
 const pinfl=text(fd,"pinfl"),documentType=text(fd,"documentType"),series=text(fd,"documentSeries").toUpperCase(),number=text(fd,"documentNumber").toUpperCase();
 const front=fd.get("documentFront"),back=fd.get("documentBack");
 if(!uuid.test(listingId)||!uuid.test(programId))return{ok:false,message:"E’lon yoki bank dasturi identifikatori noto‘g‘ri."};
 if(!/^\+?998\d{9}$/.test(phone.replace(/[()\-]/g,"")))return{ok:false,message:"Telefon raqamini +998 formatida kiriting."};
 if(!/^\d{14}$/.test(pinfl))return{ok:false,message:"JSHSHIR 14 ta raqamdan iborat bo‘lishi kerak."};
 if(!["passport","id_card"].includes(documentType))return{ok:false,message:"Hujjat turini tanlang."};
 if(series&&!/^[A-Z]{2}$/.test(series))return{ok:false,message:"Hujjat seriyasi 2 ta lotin harfi bo‘lishi kerak."};
 if(!/^[A-Z0-9]{7,12}$/.test(number))return{ok:false,message:"Hujjat raqamini tekshiring."};
 if(!(front instanceof File)||!(back instanceof File))return{ok:false,message:"Hujjatning old va orqa tomonini yuklang."};
 if(text(fd,"personalDataConsent")!=="true")return{ok:false,message:"Shaxsiy ma’lumotlarni qayta ishlashga rozilik bering."};
 try{
  await validateImage(front,"Hujjat old tomoni");await validateImage(back,"Hujjat orqa tomoni");
  const db=createPublicServerClient();
  const {data:listing}=await db.from("used_car_listings") .select("id,brand,model,year,price,currency,country_of_origin,fuel_type,status,expires_at").eq("id",listingId).eq("status","active").gt("expires_at",new Date().toISOString()).maybeSingle();
  if(!listing)throw new Error("E’lon faol emas yoki topilmadi.");
  const eligible=await new FinancingService().getBankCreditProgramsForUsedCar(Number(listing.price),listing.currency,{year:Number(listing.year),origin:listing.country_of_origin,fuelType:listing.fuel_type,brand:listing.brand});
  const program=(eligible.data??[]).find((p)=>p.id===programId);
  if(!program)throw new Error("Tanlangan bank dasturi ushbu avtomobil uchun hozir mos emas.");
  const rules=(program.financing_program_rules??[]).filter((r)=>r.is_available!==false);
  const rule=rules.slice().sort((a,b)=>Number(a.down_payment_percent)-Number(b.down_payment_percent)||Number(b.term_months)-Number(a.term_months))[0]??null;
  const down=Number(rule?.down_payment_percent??program.min_down_payment_percent??0);
  const term=Number(rule?.term_months??program.max_term_months??program.term_months??0);
  const rate=Number(rule?.annual_interest_rate??program.annual_interest_rate??0);
  if(!money(down)||down>100||!Number.isInteger(term)||term<1||term>120||!money(rate)||rate>100)throw new Error("Bank kredit shartlarini hisoblash uchun yaroqli ma’lumot yo‘q.");
  const creditPrice=Number(program.calculator_price??listing.price);
  const creditCurrency=program.currency==="USD"?"USD":"UZS";
  const principal=Math.max(0,Math.round(creditPrice*(1-down/100)));
  const monthly=monthlyPayment(principal,rate,term);
  const bank=Array.isArray(program.banks)?program.banks[0]:program.banks;
  if(!bank?.id)throw new Error("Bank ma’lumoti topilmadi.");
  const supabase=createServiceRoleClient(),folder=customer.id+"/"+listingId+"/"+randomUUID();
  const frontPath=folder+"/document-front",backPath=folder+"/document-back";
  const up1=await supabase.storage.from("used-car-credit-documents").upload(frontPath,front,{contentType:front.type,upsert:false});
  if(up1.error)throw new Error("Hujjat rasmini xavfsiz saqlab bo‘lmadi.");
  const up2=await supabase.storage.from("used-car-credit-documents").upload(backPath,back,{contentType:back.type,upsert:false});
  if(up2.error){await supabase.storage.from("used-car-credit-documents").remove([frontPath]);throw new Error("Ikkinchi hujjat rasmini saqlab bo‘lmadi.");}
  const created=await supabase.from("used_car_credit_applications").insert({
   listing_id:listingId,applicant_id:customer.id,bank_id:bank.id,financing_program_id:programId,
   applicant_phone:phone,pinfl,document_type:documentType,document_series:series||null,document_number:number,
   document_front_path:frontPath,document_back_path:backPath,personal_data_consent:true,personal_data_consent_at:new Date().toISOString(),
   car_price:Number(listing.price),car_currency:listing.currency,credit_currency:creditCurrency,annual_interest_rate:rate,down_payment_percent:down,
   term_months:term,estimated_monthly_payment:monthly,status:"pending"
  }).select("id").single();
  if(created.error||!created.data){await supabase.storage.from("used-car-credit-documents").remove([frontPath,backPath]);throw new Error("Arizani saqlab bo‘lmadi. Qayta urinib ko‘ring.");}
  revalidatePath("/admin/used-car-credit-applications");
  return{ok:true,id:created.data.id};
 }catch(error){return{ok:false,message:error instanceof Error?error.message:"Arizani yuborib bo‘lmadi."};}
}
