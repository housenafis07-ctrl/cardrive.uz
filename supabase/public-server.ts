import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, getSupabasePublicKey } from "@/lib/env";

export function createPublicServerClient() {
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabasePublicKey(env),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
