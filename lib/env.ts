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
  PAYME_MERCHANT_ID: z.string().regex(/^\\d+$/).optional(),
  PAYME_MERCHANT_KEY: z.string().min(1).optional(),
  PAYME_SERVER_CALLBACK_URL: z.string().url().optional(),
  PAYME_RESPONSE_URL: z.string().url().optional(),
}).refine((env) => Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), {
  message: "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
});

export const getServerEnv = () => serverEnvSchema.parse(process.env);
export const getSupabasePublicKey = (env: ReturnType<typeof getServerEnv>) => env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
