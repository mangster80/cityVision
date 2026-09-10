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

const proposalImageBucket = "proposal-images";
const publicStoragePrefix = `/storage/v1/object/public/${proposalImageBucket}/`;

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Bilden har ett ogiltigt format.");
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return { blob: new Blob([bytes], { type: match[1] }), extension: match[1].split("/")[1].replace("jpeg", "jpg") };
}

async function uploadProposalImages(images: string[], userId: string, proposalId: string) {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const client = supabase;
  const paths: string[] = [];
  try {
    for (const [index, image] of images.entries()) {
      const { blob, extension } = dataUrlToBlob(image);
      const path = `${userId}/${proposalId}/${index}.${extension}`;
      const { error } = await client.storage.from(proposalImageBucket).upload(path, blob, {
        contentType: blob.type,
        // A retry after a partially completed save may reuse the same path.
        // Replacing that object is safe because the path contains a new proposal UUID.
        upsert: true,
        cacheControl: "31536000",
      });
      if (error) throw error;
      paths.push(path);
    }
    return paths.map(path => client.storage.from(proposalImageBucket).getPublicUrl(path).data.publicUrl);
  } catch (error) {
    if (paths.length > 0) await client.storage.from(proposalImageBucket).remove(paths);
    throw error;
  }
}

function publicUrlToStoragePath(url: string) {
  const path = url.split(publicStoragePrefix)[1];
  return path || null;
}

export async function createSupabaseProposal(input: CreateProposalInput) {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error("Din inloggning har gått ut. Logga in igen med en ny magic link.");
  if (!authData.user) throw new Error("Du måste vara inloggad med en aktiv magic link-session för att skapa ett förslag.");

  const placeName = input.placeName.trim();
  const municipality = input.municipality.trim();
  const { data: existingPlace, error: placeLookupError } = await supabase
    .from("places")
    .select("id")
    .eq("name", placeName)
    .eq("municipality", municipality)
    .maybeSingle();
  if (placeLookupError) throw placeLookupError;

  let placeId = existingPlace?.id;
  if (!placeId) {
    const { data: createdPlace, error: placeCreateError } = await supabase
      .from("places")
      .insert({
        name: placeName,
        city: municipality,
        municipality,
        description: input.problem.trim() || input.idea.trim(),
        image: input.beforeImages[0],
        lat: input.latitude ?? 0,
        lng: input.longitude ?? 0,
        category: input.category.trim() || "Plats",
      })
      .select("id")
      .single();
    if (placeCreateError) throw placeCreateError;
    placeId = createdPlace.id;
  }

  const id = crypto.randomUUID();
  let beforeImageUrls: string[] = [];
  let afterImageUrls: string[] = [];
  try {
    beforeImageUrls = await uploadProposalImages(input.beforeImages, authData.user.id, id);
    afterImageUrls = await uploadProposalImages(input.afterImages, authData.user.id, id);
  } catch (error) {
    const uploadedPaths = [...beforeImageUrls, ...afterImageUrls]
      .map(publicUrlToStoragePath)
      .filter((path): path is string => Boolean(path));
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(proposalImageBucket).remove(uploadedPaths);
    }
    throw error;
  }
  const description = input.problem.trim() ? `${input.problem.trim()}\n\n${input.idea.trim()}` : input.idea.trim();
  const cost = Number(input.cost) || 0;
  try {
    const { error } = await supabase.from("proposals").insert({
      id,
      place_id: placeId,
      author_id: authData.user.id,
      title: input.title.trim(),
      description,
      image_before: beforeImageUrls[0],
      image_after: afterImageUrls[0],
      images_before: beforeImageUrls,
      images_after: afterImageUrls,
      cost,
      municipality,
      category: input.category.trim() || "Plats",
    });
    if (error) throw error;
  } catch (error) {
    await supabase.storage.from(proposalImageBucket).remove([
      ...beforeImageUrls,
      ...afterImageUrls,
    ].map(publicUrlToStoragePath).filter((path): path is string => Boolean(path)));
    throw error;
  }

  return id;
}

export async function deleteSupabaseProposal(proposalId: string) {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error("Din inloggning har gått ut. Logga in igen.");
  if (!authData.user) throw new Error("Du måste vara inloggad för att ta bort ett förslag.");

  const { data, error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", proposalId)
    .eq("author_id", authData.user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Du kan bara ta bort förslag som du själv har skapat.");
}
