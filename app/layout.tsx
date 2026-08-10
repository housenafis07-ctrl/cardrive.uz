import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Cardrive.uz", description: "New automobile marketplace for Uzbekistan" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="uz"><body>{children}</body></html>; }
