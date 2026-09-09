import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";
  const supabase = await createClient();
  const [{ data: places, error: placesError }, { data: proposals, error: proposalsError }] = await Promise.all([
    supabase.from("places").select("id").order("name"),
    supabase.from("proposals").select("id, created_at").order("created_at", { ascending: false }),
  ]);
  if (placesError) throw placesError;
  if (proposalsError) throw proposalsError;

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/explore`, changeFrequency: "daily", priority: 0.9 },
    ...(places ?? []).map(place => ({ url: `${baseUrl}/place/${place.id}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(proposals ?? []).map(proposal => ({ url: `${baseUrl}/proposal/${proposal.id}`, lastModified: proposal.created_at, changeFrequency: "weekly" as const, priority: 0.7 }))
  ];
  return routes;
}
