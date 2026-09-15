import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import { PwaRegister } from "./pwa-register";

const siteUrl = "https://cardrive.uz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cardrive.uz — Avtomobil sotib olish, avtokredit va rassrochka | O‘zbekiston",
    template: "%s | Cardrive.uz",
  },
  description:
    "Cardrive.uz — O‘zbekistonda yangi avtomobil sotib olish uchun onlayn katalog. Chevrolet, BYD, Kia va boshqa avtomobillar narxi, komplektatsiyasi, avtokredit, rassrochka va moliyalashtirish takliflarini solishtiring.",
  applicationName: "Cardrive.uz",
  keywords: [
    "Cardrive",
    "cardrive.uz",
    "avtomobil sotib olish",
    "avtomobil sotib olish onlayn",
    "yangi avtomobil sotib olish",
    "avtokredit",
    "avtokredit O‘zbekiston",
    "eng arzon avtokredit",
    "avtokredit foiz stavkasi",
    "avtokredit kalkulyator",
    "rassrochka",
    "avtomobil rassrochka",
    "avto rassrochka",
    "0% rassrochka",
    "0 foiz avtokredit",
    "foizsiz avtokredit",
    "boshlang‘ich to‘lovsiz avtomobil",
    "avtomobillar narxi",
    "yangi avtomobillar",
    "avtomobil katalogi",
    "O‘zbekiston avtomobillari",
    "Chevrolet",
    "BYD",
    "Kia",
  ],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "Cardrive",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Cardrive.uz",
    title: "Cardrive.uz — Avtomobil sotib olish, avtokredit va rassrochka",
    description:
      "Yangi avtomobillarni narxi va komplektatsiyasi bilan solishtiring. Avtokredit, rassrochka va moliyalashtirish imkoniyatlarini Cardrive.uz orqali ko‘ring.",
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardrive.uz — Avtomobil sotib olish va avtokredit",
    description: "Yangi avtomobillar, avtokredit va rassrochka takliflari.",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0EA5FF",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cardrive.uz",
    url: siteUrl,
    logo: `${siteUrl}/icons/icon-512.png`,
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Cardrive.uz",
    url: siteUrl,
    description: "O‘zbekistonda avtomobil sotib olish, yangi avtomobillar, avtokredit va rassrochka katalogi.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/cars?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <html lang={locale}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
        <PwaRegister />
        <Script src="//code.jivo.ru/widget/LO1U03jwav" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
