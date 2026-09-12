import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export const metadata: Metadata = {
  title: "Utforska stadsförslag och platser i din kommun",
  description: "Upptäck lokala platser, kartlägg visioner och hitta medborgarförslag som gör städer tryggare, grönare och mer levande.",
  keywords: [
    "utforska stadsförslag",
    "karta stadsutveckling",
    "medborgarförslag sverige",
    "idéer för städer",
    "lokala initiativ",
    "Stadslyft karta"
  ],
  alternates: {
    canonical: `${siteUrl}/explore`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/explore`,
    siteName: "Stadslyft",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
    title: "Utforska stadsförslag och platser | Stadslyft",
    description: "Upptäck lokala platser, kartlägg visioner och hitta medborgarförslag som gör städer tryggare, grönare och mer levande.",
    images: [{
      url: `${siteUrl}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: "Utforska Stadslyft"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Utforska stadsförslag och platser | Stadslyft",
    description: "Upptäck lokala platser, kartlägg visioner och hitta medborgarförslag.",
    images: [`${siteUrl}/twitter-image`]
  }
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
