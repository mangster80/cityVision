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
  const { data: proposal } = await supabase
    .from("proposals")
    .select("title, description, image_after, municipality, category, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) return { title: "Förslag hittades inte" };

  const description = proposal.description.replace(/\s+/gu, " ").slice(0, 160);
  const url = `${siteUrl}/proposal/${id}`;
  return {
    title: proposal.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: proposal.title,
      description,
      images: [{ url: proposal.image_after, alt: proposal.title }],
      publishedTime: undefined,
      authors: [`${siteUrl}/profile?user=${proposal.author_id}`],
    },
    twitter: {
      card: "summary_large_image",
      title: proposal.title,
      description,
      images: [proposal.image_after],
    },
  };
}

export default function ProposalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
