import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: place } = await supabase
    .from("places")
    .select("name, description, image, municipality, category")
    .eq("id", id)
    .maybeSingle();

  if (!place) return { title: "Plats hittades inte" };

  const description = `${place.description} ${place.category} i ${place.municipality}.`;
  const url = `${siteUrl}/place/${id}`;
  return {
    title: place.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: place.name,
      description,
      images: [{ url: place.image, alt: place.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description,
      images: [place.image],
    },
  };
}

export default function PlaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
