import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export const metadata: Metadata = {
  title: "Alla stadsförslag & idéer för stadsutveckling",
  description: "Bläddra bland alla medborgarförslag och visioner för bättre stadsmiljöer. Rösta, kommentera och engagera dig för din stad.",
  keywords: [
    "alla stadsförslag",
    "medborgarförslag",
    "stadsutveckling",
    "rösta på förslag",
    "lokala idéer",
    "Stadslyft förslag"
  ],
  alternates: {
    canonical: `${siteUrl}/proposal`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/proposal`,
    siteName: "Stadslyft",
    locale: "sv_SE",
    alternateLocale: ["en_US"],
    title: "Alla stadsförslag & idéer | Stadslyft",
    description: "Bläddra bland alla medborgarförslag och visioner för bättre stadsmiljöer. Rösta, kommentera och engagera dig för din stad.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Stadsförslag på Stadslyft"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Alla stadsförslag & idéer | Stadslyft",
    description: "Bläddra bland alla medborgarförslag och visioner för bättre stadsmiljöer.",
    images: ["/twitter-image"]
  }
};

export default function ProposalListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
