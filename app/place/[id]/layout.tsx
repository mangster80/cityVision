import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: place } = await supabase
    .from("places")
    .select("name, description, image, municipality, category, lat, lng")
    .eq("id", id)
    .maybeSingle();

  if (!place) return { title: "Plats hittades inte | Stadslyft" };

  const title = `${place.name} i ${place.municipality} – Upptäck & Förbättra`;
  const description = `${place.description ? place.description.slice(0, 150) : "Se idéer för platsen"} Upptäck förslag för ${place.name} i ${place.municipality} på Stadslyft.`.slice(0, 160);
  const url = `${siteUrl}/place/${id}`;
  
  return {
    title,
    description,
    keywords: [
      place.name,
      place.municipality,
      `stadsutveckling ${place.municipality}`,
      `medborgarförslag ${place.municipality}`,
      place.category,
      "Stadslyft",
      "lokala stadsidéer"
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Stadslyft",
      locale: "sv_SE",
      alternateLocale: ["en_US"],
      title: `${title} | Stadslyft`,
      description,
      images: [{
        url: place.image || `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: place.name
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Stadslyft`,
      description,
      images: [place.image || `${siteUrl}/twitter-image`],
    },
    other: {
      "geo.region": "SE",
      "geo.placename": place.municipality,
      "geo.position": `${place.lat};${place.lng}`,
      "ICBM": `${place.lat}, ${place.lng}`,
    }
  };
}

export default async function PlaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: place } = await supabase
    .from("places")
    .select("name, description, image, municipality, category, lat, lng")
    .eq("id", id)
    .maybeSingle();

  const jsonLd = place
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Place",
            "@id": `${siteUrl}/place/${id}#place`,
            "name": place.name,
            "description": place.description,
            "image": place.image,
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": place.lat,
              "longitude": place.lng,
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": place.municipality,
              "addressCountry": "SE",
            },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${siteUrl}/place/${id}#breadcrumb`,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Hem",
                "item": siteUrl,
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Utforska",
                "item": `${siteUrl}/explore`,
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": place.name,
                "item": `${siteUrl}/place/${id}`,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
