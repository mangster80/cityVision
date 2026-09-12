import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthCodeRedirect } from "@/components/auth-code-redirect";
import { Footer } from "@/components/footer";
import { IdleLogout } from "@/components/idle-logout";
import { Suspense } from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stadslyft — Gör staden bättre",
    template: "%s | Stadslyft"
  },
  description: "Upptäck platser, dela idéer och bidra till en bättre stad. Plattformen för medborgardialog och lokal stadsutveckling i Sverige.",
  keywords: [
    "Stadslyft",
    "stadsutveckling",
    "medborgardialog",
    "medborgarförslag",
    "förbättra staden",
    "lokala idéer",
    "stadsplanering",
    "samhällsbyggnad",
    "hållbar stad",
    "lokalpolitik",
    "medborgarinitiativ"
  ],
  authors: [{ name: "Stadslyft", url: siteUrl }],
  creator: "Stadslyft",
  publisher: "Stadslyft",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "sv-SE": "/",
      "en-US": "/?lang=en",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    locale: "sv_SE",
    alternateLocale: ["en_US"],
    siteName: "Stadslyft",
    title: "Stadslyft — Gör staden bättre",
    description: "Upptäck platser, dela idéer och bidra till en bättre stad. Skapa och rösta på lokala stadsförslag.",
    images: [{
      url: `${siteUrl}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: "Stadslyft — Gör staden bättre"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Stadslyft — Gör staden bättre",
    description: "Upptäck platser, dela idéer och bidra till en bättre stad.",
    images: [`${siteUrl}/twitter-image`]
  },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Stadslyft",
        "description": "Plattform för medborgardialog och lokal stadsutveckling i Sverige.",
        "inLanguage": "sv-SE",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/explore?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Stadslyft",
        "url": siteUrl,
        "logo": `${siteUrl}/opengraph-image`,
        "description": "Upptäck platser, dela idéer och bidra till en bättre stad.",
        "areaServed": "SE",
        "knowsAbout": ["Stadsutveckling", "Medborgardialog", "Medborgarförslag", "Samhällsplanering"]
      }
    ]
  };

  return (
    <html lang="sv" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
              />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
              >
                Hoppa till huvudinnehåll
              </a>
              <Header />
              <IdleLogout />
              <Suspense fallback={null}>
                <AuthCodeRedirect />
              </Suspense>
              <div id="main-content" tabIndex={-1}>
                {children}
              </div>
              <Footer />
              <Analytics />
              <SpeedInsights />
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
