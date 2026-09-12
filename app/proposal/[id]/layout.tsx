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
  const { data: proposal } = await supabase
    .from("proposals")
    .select("title, description, image_after, image_before, municipality, category, author_id, created_at, status_updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) return { title: "Förslag hittades inte | Stadslyft" };

  const title = `${proposal.title} – Stadsförslag i ${proposal.municipality}`;
  const description = proposal.description.replace(/\s+/gu, " ").slice(0, 160);
  const url = `${siteUrl}/proposal/${id}`;
  const imageUrl = proposal.image_after || proposal.image_before || `${siteUrl}/opengraph-image`;

  return {
    title,
    description,
    keywords: [
      proposal.title,
      proposal.municipality,
      proposal.category,
      `medborgarförslag ${proposal.municipality}`,
      `stadsutveckling ${proposal.municipality}`,
      "Stadslyft",
      "lokala initiativ"
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Stadslyft",
      locale: "sv_SE",
      alternateLocale: ["en_US"],
      title: `${title} | Stadslyft`,
      description,
      publishedTime: proposal.created_at,
      modifiedTime: proposal.status_updated_at || proposal.created_at,
      section: proposal.category,
      tags: [proposal.category, proposal.municipality, "Stadsutveckling", "Medborgarförslag"],
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: proposal.title
      }],
      authors: [`${siteUrl}/profile?user=${proposal.author_id}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Stadslyft`,
      description,
      images: [imageUrl],
    },
    other: {
      "geo.region": "SE",
      "geo.placename": proposal.municipality,
    }
  };
}

export default async function ProposalLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, title, description, image_after, image_before, municipality, category, author_id, created_at, status_updated_at, place_id, cost")
    .eq("id", id)
    .maybeSingle();

  let placeName: string | null = null;
  if (proposal?.place_id) {
    const { data: place } = await supabase
      .from("places")
      .select("name")
      .eq("id", proposal.place_id)
      .maybeSingle();
    placeName = place?.name ?? null;
  }

  const jsonLd = proposal
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["Article", "CreativeWork"],
            "@id": `${siteUrl}/proposal/${id}#proposal`,
            "headline": proposal.title,
            "description": proposal.description,
            "image": [proposal.image_after, proposal.image_before].filter(Boolean),
            "datePublished": proposal.created_at,
            "dateModified": proposal.status_updated_at || proposal.created_at,
            "author": {
              "@type": "Person",
              "name": "Medborgare",
              "url": `${siteUrl}/profile?user=${proposal.author_id}`,
            },
            "publisher": {
              "@type": "Organization",
              "name": "Stadslyft",
              "url": siteUrl,
              "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/opengraph-image`,
              },
            },
            "mainEntityOfPage": `${siteUrl}/proposal/${id}`,
            "spatialCoverage": {
              "@type": "Place",
              "name": placeName || proposal.municipality,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": proposal.municipality,
                "addressCountry": "SE",
              },
            },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${siteUrl}/proposal/${id}#breadcrumb`,
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
              ...(proposal.place_id && placeName
                ? [
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": placeName,
                      "item": `${siteUrl}/place/${proposal.place_id}`,
                    },
                    {
                      "@type": "ListItem",
                      "position": 4,
                      "name": proposal.title,
                      "item": `${siteUrl}/proposal/${id}`,
                    },
                  ]
                : [
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": proposal.title,
                      "item": `${siteUrl}/proposal/${id}`,
                    },
                  ]),
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
