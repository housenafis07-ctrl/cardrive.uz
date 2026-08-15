import { z } from "zod";
import { idSchema } from "@/schemas/common";

// Server Action input. Deliberately minimal — the browser may supply ONLY these two
// identifiers. Everything else (customerId, bankId, amount, status,
// externalApplicationId, provider) is derived server-side, never accepted here.
export const submitCreditApplicationInputSchema = z.object({
  orderId: idSchema,
  financingProgramId: idSchema,
});

// Server Action input for manual status refresh. The browser may supply ONLY the
// application id — everything else (customerId, bankId, provider, status,
// externalApplicationId) is derived server-side.
export const syncApplicationStatusInputSchema = z.object({
  applicationId: idSchema,
});

// The set of statuses the credit_applications.status CHECK constraint allows.
export const creditApplicationStatusSchema = z.enum([
  "pending",
  "submitted",
  "approved",
  "rejected",
  "cancelled",
  "failed",
]);

// Shape a BankProvider.submitCreditApplication() response must satisfy before this
// service ever persists it. Matches the existing BankProvider interface's return
// type exactly — nothing provider-specific is assumed.
export const providerSubmissionResponseSchema = z.object({
  externalApplicationId: z.string().trim().min(1),
  status: z.string().trim().min(1),
});

// Shape a BankProvider.getApplicationStatus() response must satisfy before a sync
// result is ever trusted. Deliberately minimal — matches the existing
// BankProvider interface exactly, no raw payload fields.
export const providerStatusResponseSchema = z.object({
  status: z.string().trim().min(1),
});

