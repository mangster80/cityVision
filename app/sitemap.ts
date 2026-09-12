import type { MetadataRoute } from "next";
import { createPublicClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se").replace(/\/+$/, "");

  let places: { id: string; image?: string; updated_at?: string; created_at?: string }[] = [];
  let proposals: { id: string; image_after?: string; image_before?: string; created_at?: string; status_updated_at?: string }[] = [];

  try {
    const supabase = createPublicClient();
    const [{ data: placesData }, { data: proposalsData }] = await Promise.all([
      supabase.from("places").select("id, image, created_at, updated_at").order("name"),
      supabase.from("proposals").select("id, image_after, image_before, created_at, status_updated_at").order("created_at", { ascending: false }),
    ]);
    if (placesData) places = placesData;
    if (proposalsData) proposals = proposalsData;
  } catch (err) {
    console.error("Error generating dynamic sitemap routes:", err);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/proposal`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const placeRoutes: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${baseUrl}/place/${place.id}`,
    lastModified: place.updated_at || place.created_at || new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
    images: place.image ? [place.image] : undefined,
  }));

  const proposalRoutes: MetadataRoute.Sitemap = proposals.map((proposal) => {
    const images = [proposal.image_after, proposal.image_before].filter(Boolean) as string[];
    return {
      url: `${baseUrl}/proposal/${proposal.id}`,
      lastModified: proposal.status_updated_at || proposal.created_at || new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.8,
      images: images.length > 0 ? images : undefined,
    };
  });

  return [...staticRoutes, ...placeRoutes, ...proposalRoutes];
}
