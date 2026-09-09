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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Stadslyft",
    title: "Stadslyft — Gör staden bättre",
    description: "Upptäck platser, dela idéer och bidra till en bättre stad."
  },
  twitter: {
    card: "summary",
    title: "Stadslyft — Gör staden bättre",
    description: "Upptäck platser, dela idéer och bidra till en bättre stad."
  },
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body><LanguageProvider><ThemeProvider><ToastProvider><Header /><IdleLogout /><Suspense fallback={null}><AuthCodeRedirect /></Suspense>{children}<Footer /><Analytics /><SpeedInsights /></ToastProvider></ThemeProvider></LanguageProvider></body>
    </html>
  );
}
