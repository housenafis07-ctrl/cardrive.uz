"use server";
import {revalidatePath} from "next/cache";
import {ZodError} from "zod";
import {getCurrentCustomer} from "@/lib/customer-session";
import {CreditApplicationService} from "@/services/credit-application-service";
const text=(fd:FormData,key:string)=>{const v=fd.get(key);return typeof v==="string"&&v.trim()?v.trim():null;};
export type SubmitCreditApplicationResult={status:"submitted";applicationId:string}|{status:"already_exists";applicationId:string;applicationStatus:string}|{status:"error";message:string};
export type SyncCreditApplicationStatusResult={status:"ok";applicationStatus:string}|{status:"error";message:string};
export async function submitCreditApplicationAction(fd:FormData):Promise<SubmitCreditApplicationResult>{
 const customer=await getCurrentCustomer();if(!customer)return{status:"error",message:"Ariza yuborish uchun avval tasdiqlashdan o'ting"};
 const orderId=text(fd,"orderId"),financingProgramId=text(fd,"financingProgramId"),applicantPhone=text(fd,"applicantPhone"),pinfl=text(fd,"pinfl"),passportSeries=text(fd,"passportSeries"),passportNumber=text(fd,"passportNumber");
 const passportFront=fd.get("passportFront"),passportBack=fd.get("passportBack");
 if(!orderId||!financingProgramId||!applicantPhone||!pinfl||!passportSeries||!passportNumber||!(passportFront instanceof File)||!(passportBack instanceof File))return{status:"error",message:"Barcha maydonlarni to‘ldiring va pasportning old hamda orqa rasmlarini yuklang."};
 if(text(fd,"oneidConsentConfirmed")!=="true"||text(fd,"personalDataConsent")!=="true")return{status:"error",message:"OneID va shaxsiy ma’lumotlarni qayta ishlash roziligini tasdiqlang."};
 try{
  const result=await new CreditApplicationService().submitApplication({orderId,financingProgramId,oneidConsentConfirmed:true,personalDataConsent:true,applicantPhone,pinfl,passportSeries,passportNumber},{passportFront,passportBack},customer.id);
  revalidatePath("/account/orders/"+orderId);revalidatePath("/admin/credit-applications");
  if(result.outcome==="already_exists")return{status:"already_exists",applicationId:result.applicationId,applicationStatus:result.status};
  return{status:"submitted",applicationId:result.applicationId};
 }catch(error){if(error instanceof ZodError)return{status:"error",message:"Kiritilgan ma’lumotlarni tekshiring. JSHSHIR, pasport va telefon formatiga e’tibor bering."};return{status:"error",message:error instanceof Error?error.message:"Ariza yuborib bo'lmadi"};}
}
export async function syncCreditApplicationStatusAction(fd:FormData):Promise<SyncCreditApplicationStatusResult>{const customer=await getCurrentCustomer();if(!customer)return{status:"error",message:"Holatni yangilash uchun avval tasdiqlashdan o'ting"};const applicationId=text(fd,"applicationId");if(!applicationId)return{status:"error",message:"So'rov yaroqsiz"};try{const result=await new CreditApplicationService().syncApplicationStatus({applicationId},customer.id,customer.phone);revalidatePath("/account/orders/"+result.orderId);return{status:"ok",applicationStatus:result.status};}catch(error){if(error instanceof ZodError)return{status:"error",message:"So'rov yaroqsiz"};return{status:"error",message:error instanceof Error?error.message:"Holatni yangilab bo'lmadi"};}}
