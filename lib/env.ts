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
}).refine((env) => Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), {
  message: "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
});

export const getServerEnv = () => serverEnvSchema.parse(process.env);
export const getSupabasePublicKey = (env: ReturnType<typeof getServerEnv>) => env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
