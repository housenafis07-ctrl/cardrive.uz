import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv, getSupabasePublicKey } from "@/lib/env";
import type { AuthenticatedUser, UserRole } from "@/types/domain";

export async function getAdminUser(): Promise<AuthenticatedUser | null> {
  const env = getServerEnv();
  const store = await cookies();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, getSupabasePublicKey(env), {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data: profile } = await client.from("profiles").select("role,phone,is_active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.is_active || (profile.role !== "admin" && profile.role !== "manager")) return null;
  return { id: user.id, role: profile.role as UserRole, phone: profile.phone };
}

export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function signOutAdminUser() {
  const env = getServerEnv();
  const store = await cookies();
  const client = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, getSupabasePublicKey(env), {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
  await client.auth.signOut();
}
