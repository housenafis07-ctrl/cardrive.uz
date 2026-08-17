import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n";
export const metadata: Metadata = { title: "Cardrive.uz", description: "New automobile marketplace for Uzbekistan" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const locale = await getLocale(); return <html lang={locale}><body>{children}</body></html>; }
