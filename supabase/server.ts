import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

export function createServiceRoleClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Editorial moderation uses an isolated schema on Vercel Preview.
 * Production and local environments continue to use public until the
 * reviewed editorial migration is explicitly applied to Production.
 */
export function createNewsEditorialClient() {
  const env = getServerEnv();
  const schema = process.env.VERCEL_ENV === "preview" ? "news_stage" : "public";
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}


/**
 * CRM data is isolated in the existing news_stage schema on Vercel Preview.
 * Production continues to use public and is not changed by preview validation.
 */
export function createCrmClient() {
  const env = getServerEnv();
  const schema = process.env.VERCEL_ENV === "preview" ? "news_stage" : "public";
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
