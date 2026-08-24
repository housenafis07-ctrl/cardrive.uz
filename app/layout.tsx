import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n";

const siteUrl = "https://cardrive.uz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cardrive.uz — Yangi avtomobillar katalogi | O‘zbekiston",
    template: "%s | Cardrive.uz",
  },
  description:
    "Cardrive.uz — O‘zbekistondagi yangi avtomobillar katalogi. Chevrolet, BYD, Kia va boshqa avtomobillarni narxi, komplektatsiyasi va xususiyatlari bilan solishtiring.",
  applicationName: "Cardrive.uz",
  keywords: [
    "Cardrive",
    "cardrive.uz",
    "avtomobillar",
    "yangi avtomobillar",
    "avtomobil katalogi",
    "O‘zbekiston avtomobillari",
    "Chevrolet",
    "BYD",
    "Kia",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Cardrive.uz",
    title: "Cardrive.uz — Yangi avtomobillar katalogi | O‘zbekiston",
    description:
      "O‘zbekistondagi yangi avtomobillar katalogi. Avtomobillarni narxi, komplektatsiyasi va xususiyatlari bilan ko‘ring.",
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardrive.uz — Yangi avtomobillar katalogi",
    description: "O‘zbekistondagi yangi avtomobillar katalogi.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale}><body>{children}</body></html>;
}
