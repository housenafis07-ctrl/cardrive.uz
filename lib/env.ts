import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ESKIZ_EMAIL: z.string().email().optional(),
  ESKIZ_PASSWORD: z.string().min(1).optional(),
  ESKIZ_FROM: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).optional(),
  PAYME_MERCHANT_ID: z.string().regex(/^\d+$/).optional(),
  PAYME_MERCHANT_KEY: z.string().min(1).optional(),
  PAYME_SERVER_CALLBACK_URL: z.string().url().optional(),
  PAYME_RESPONSE_URL: z.string().url().optional(),
  CLICK_SERVICE_ID: z.string().regex(/^\\d+$/).optional(),
  CLICK_SECRET_KEY: z.string().min(1).optional(),
}).refine((env) => Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), {
  message: "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
}).refine((env) => Boolean(env.PAYME_MERCHANT_ID) === Boolean(env.PAYME_MERCHANT_KEY), {
  message: "Set both PAYME_MERCHANT_ID and PAYME_MERCHANT_KEY, or leave both unset",
  path: ["PAYME_MERCHANT_ID"],
}).refine((env) => Boolean(env.CLICK_SERVICE_ID) === Boolean(env.CLICK_SECRET_KEY), {
  message: "Set both CLICK_SERVICE_ID and CLICK_SECRET_KEY, or leave both unset",
  path: ["CLICK_SERVICE_ID"],
});

export const getServerEnv = () => serverEnvSchema.parse(process.env);
export const getSupabasePublicKey = (env: ReturnType<typeof getServerEnv>) => env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
