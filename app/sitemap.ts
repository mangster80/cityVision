import type { MetadataRoute } from "next";
import { places, proposals } from "@/data/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";
  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/explore`, changeFrequency: "daily", priority: 0.9 },
    ...places.map(place => ({ url: `${baseUrl}/place/${place.id}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...proposals.map(proposal => ({ url: `${baseUrl}/proposal/${proposal.id}`, lastModified: proposal.createdAt, changeFrequency: "weekly" as const, priority: 0.7 }))
  ];
  return routes;
}
