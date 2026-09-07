import { supabase } from "@/services/supabase";

export interface CreateProposalInput {
  placeName: string;
  municipality: string;
  title: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  problem: string;
  idea: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
}

export async function createSupabaseProposal(input: CreateProposalInput) {
  if (!supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error("Din inloggning har gått ut. Logga in igen med en ny magic link.");
  if (!authData.user) throw new Error("Du måste vara inloggad med en aktiv magic link-session för att skapa ett förslag.");

  const id = crypto.randomUUID();
  const placeId = input.placeName.trim().toLocaleLowerCase("sv-SE").replace(/[^a-z0-9åäö]+/gi, "-").replace(/(^-|-$)/g, "") || id;
  const description = input.problem.trim() ? `${input.problem.trim()}\n\n${input.idea.trim()}` : input.idea.trim();
  const cost = Number(input.cost) || 0;
  const { error } = await supabase.from("proposals").insert({
    id,
    place_id: placeId,
    author_id: authData.user.id,
    title: input.title.trim(),
    description,
    image_before: input.beforeImages[0],
    image_after: input.afterImages[0],
    images_before: input.beforeImages,
    images_after: input.afterImages,
    cost,
    municipality: input.municipality.trim(),
    category: input.category.trim() || "Plats",
  });
  if (error) throw error;

  return id;
}
