import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export const metadata: Metadata = {
  title: "Om Stadslyft — Så fungerar plattformen",
  description: "Läs om hur Stadslyft gör det enkelt för invånare, kommuner och eldsjälar att samverka för att skapa tryggare, vackrare och mer levande städer.",
  keywords: [
    "om stadslyft",
    "hur fungerar stadslyft",
    "medborgardialog digitalt",
    "stadsutveckling samverkan",
    "demokrati stadsplanering"
  ],
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    siteName: "Stadslyft",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
    title: "Om Stadslyft — Så fungerar plattformen",
    description: "Läs om hur Stadslyft gör det enkelt för invånare, kommuner och eldsjälar att samverka.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Om Stadslyft"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Om Stadslyft — Så fungerar plattformen",
    description: "Läs om hur Stadslyft gör det enkelt för invånare, kommuner och eldsjälar att samverka.",
    images: ["/twitter-image"]
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
