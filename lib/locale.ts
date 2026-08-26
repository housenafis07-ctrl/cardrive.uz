import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";
export async function getLocale(): Promise<Locale> { const value=(await cookies()).get("cardrive-locale")?.value; return value==="ru"?"ru":"uz"; }
