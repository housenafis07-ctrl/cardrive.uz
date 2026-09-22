import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { getLocale } from "@/lib/locale";

const siteUrl = "https://cardrive.uz";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0877F9",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cardrive.uz — Avtomobil sotib olish, avtokredit va rassrochka | O‘zbekiston",
    template: "%s | Cardrive.uz",
  },
  description:
    "Cardrive.uz — O‘zbekistonda yangi avtomobil sotib olish uchun onlayn katalog. Chevrolet, BYD, Kia va boshqa avtomobillar narxi, komplektatsiyasi, avtokredit, rassrochka va moliyalashtirish takliflarini solishtiring.",
  applicationName: "Cardrive.uz",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/cardrive-app-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Cardrive",
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "Cardrive", "cardrive.uz", "avtomobil sotib olish", "avtomobil sotib olish onlayn",
    "yangi avtomobil sotib olish", "avtokredit", "avtokredit O‘zbekiston", "eng arzon avtokredit",
    "avtokredit foiz stavkasi", "avtokredit kalkulyator", "rassrochka", "avtomobil rassrochka",
    "avto rassrochka", "0% rassrochka", "0 foiz avtokredit", "foizsiz avtokredit",
    "boshlang‘ich to‘lovsiz avtomobil", "avtomobillar narxi", "yangi avtomobillar",
    "avtomobil katalogi", "O‘zbekiston avtomobillari", "Chevrolet", "BYD", "Kia",
  ],
  alternates: { canonical: "/" },
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cardrive.uz",
    url: siteUrl,
    logo: `${siteUrl}/cardrive-app-icon.svg`,
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
        <style dangerouslySetInnerHTML={{ __html: `@media (max-width: 767px) { [id*="jivo"], [class*="jivo"], iframe[src*="jivo"] { bottom: 92px !important; } }` }} />
        <Script src="//code.jivo.ru/widget/LO1U03jwav" strategy="afterInteractive" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function liftJivoOnMobile() {
                  if (window.innerWidth > 767) return;
                  var nodes = document.querySelectorAll('[id*="jivo"], [class*="jivo"], iframe[src*="jivo"]');
                  nodes.forEach(function (node) {
                    if (node instanceof HTMLElement || node instanceof HTMLIFrameElement) {
                      node.style.setProperty('bottom', '92px', 'important');
                    }
                  });
                }

                liftJivoOnMobile();
                var observer = new MutationObserver(liftJivoOnMobile);
                observer.observe(document.documentElement, { childList: true, subtree: true });
                window.addEventListener('resize', liftJivoOnMobile);
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (!('serviceWorker' in navigator)) return;

                var hadController = !!navigator.serviceWorker.controller;
                var reloading = false;

                function registerCardriveServiceWorker() {
                  navigator.serviceWorker
                    .register('/sw.js', { scope: '/', updateViaCache: 'none' })
                    .then(function (registration) {
                      registration.update().catch(function () {});

                      document.addEventListener('visibilitychange', function () {
                        if (document.visibilityState === 'visible') {
                          registration.update().catch(function () {});
                        }
                      });
                    })
                    .catch(function () {});
                }

                navigator.serviceWorker.addEventListener('controllerchange', function () {
                  if (!hadController || reloading) return;
                  reloading = true;
                  window.location.reload();
                });

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', registerCardriveServiceWorker, { once: true });
                } else {
                  registerCardriveServiceWorker();
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
