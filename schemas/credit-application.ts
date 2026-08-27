import { z } from "zod";
import { idSchema } from "@/schemas/common";

export const submitCreditApplicationInputSchema = z.object({
  orderId: idSchema,
  financingProgramId: idSchema,
  oneidConsentConfirmed: z.literal(true),
});

export const syncApplicationStatusInputSchema = z.object({
  applicationId: idSchema,
});

export const creditApplicationStatusSchema = z.enum(["pending","submitted","approved","rejected","cancelled","failed"]);
export const providerSubmissionResponseSchema = z.object({externalApplicationId:z.string().trim().min(1),status:z.string().trim().min(1)});
export const providerStatusResponseSchema = z.object({status:z.string().trim().min(1)});
