import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthCodeRedirect } from "@/components/auth-code-redirect";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
export const metadata: Metadata = {
  title: "Stadslyft — Gör staden bättre",
  description: "Upptäck platser. Dela idéer. Förändra din stad.",
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body><LanguageProvider><ThemeProvider><ToastProvider><Header /><Suspense fallback={null}><AuthCodeRedirect /></Suspense>{children}</ToastProvider></ThemeProvider></LanguageProvider><Analytics /></body>
    </html>
  );
}
