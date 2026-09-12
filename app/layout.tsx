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
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se"),
  title: {
    default: "Stadslyft — Gör staden bättre",
    template: "%s | Stadslyft"
  },
  description: "Upptäck platser. Dela idéer. Förändra din stad.",
  keywords: ["Stadslyft", "stadsutveckling", "medborgardialog", "förbättra staden", "lokala idéer"],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://www.stadslyft.se/",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
    siteName: "Stadslyft",
    title: "Stadslyft — Make your city better",
    description: "Discover places, share ideas and help build a better city.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Stadslyft — Make your city better"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Stadslyft — Make your city better",
    description: "Discover places, share ideas and help build a better city.",
    images: ["/twitter-image"]
  },
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Stadslyft",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stadslyft.se",
    description: "Upptäck platser, dela idéer och bidra till en bättre stad.",
    inLanguage: "sv-SE",
  };

  return (
    <html lang="sv" suppressHydrationWarning>
      <body><LanguageProvider><ThemeProvider><ToastProvider><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white">Hoppa till huvudinnehåll</a><Header /><IdleLogout /><Suspense fallback={null}><AuthCodeRedirect /></Suspense><div id="main-content" tabIndex={-1}>{children}</div><Footer /><Analytics /><SpeedInsights /></ToastProvider></ThemeProvider></LanguageProvider></body>
    </html>
  );
}
