import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ToastProvider } from "@/components/toast-provider";
export const metadata: Metadata = {
  title: "CityVision — Gör staden bättre",
  description: "Upptäck platser. Dela idéer. Förändra din stad.",
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body><LanguageProvider><ThemeProvider><ToastProvider><Header />{children}</ToastProvider></ThemeProvider></LanguageProvider></body>
    </html>
  );
}
