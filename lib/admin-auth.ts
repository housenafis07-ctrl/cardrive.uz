import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import type { AuthenticatedUser, UserRole } from "@/types/domain";
export async function getAdminUser(): Promise<AuthenticatedUser | null> { const env=getServerEnv(); const store=await cookies(); const client=createServerClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll(){return store.getAll();},setAll(){}}}); const {data:{user}}=await client.auth.getUser(); if(!user)return null; const {data:profile}=await client.from("profiles").select("role,phone").eq("id",user.id).maybeSingle(); if(!profile || (profile.role!=="admin" && profile.role!=="manager"))return null; return {id:user.id,role:profile.role as UserRole,phone:profile.phone}; }
export async function requireAdminUser(): Promise<AuthenticatedUser> { const user=await getAdminUser(); if(!user) redirect("/forbidden"); return user; }
