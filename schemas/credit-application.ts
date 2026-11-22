import { z } from "zod";
import { idSchema, uzbekPhoneSchema } from "@/schemas/common";
export const submitCreditApplicationInputSchema = z.object({
 orderId:idSchema, financingProgramId:idSchema, oneidConsentConfirmed:z.literal(true), personalDataConsent:z.literal(true),
 applicantPhone:uzbekPhoneSchema, pinfl:z.string().regex(/^\d{14}$/,"JSHSHIR 14 ta raqamdan iborat bo‘lishi kerak"),
 passportSeries:z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/,"Pasport seriyasi 2 ta lotin harfi bo‘lishi kerak"),
 passportNumber:z.string().trim().regex(/^\d{7}$/,"Pasport raqami 7 ta raqamdan iborat bo‘lishi kerak")
});
export const syncApplicationStatusInputSchema=z.object({applicationId:idSchema});
export const creditApplicationStatusSchema=z.enum(["pending","submitted","approved","rejected","cancelled","failed"]);
export const providerSubmissionResponseSchema=z.object({externalApplicationId:z.string().trim().min(1),status:z.string().trim().min(1)});
export const providerStatusResponseSchema=z.object({status:z.string().trim().min(1)});
