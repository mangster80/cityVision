import { CityRepository } from "@/services/city-repository";
import { supabase } from "@/services/supabase";
import { Place, Proposal, User } from "@/types";

interface PlaceRow {
  id: string;
  name: string;
  city: string;
  municipality: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  category: string;
  proposals: { count: number }[] | null;
}

interface ProposalRow {
  id: string;
  place_id: string;
  municipality: string;
  title: string;
  description: string;
  image_before: string;
  image_after: string;
  images_before: string[];
  images_after: string[];
  cost: number;
  votes: number;
  supporters: number;
  comments: number;
  author_id: string;
  category: string;
  created_at: string;
}

const fallbackAuthor: User = {
  id: "unknown",
  name: "Stadslyft member",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=320&h=320&q=85",
};

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    municipality: row.municipality,
    description: row.description,
    image: row.image,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    proposalCount: row.proposals?.[0]?.count ?? 0,
  };
}

function toProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    placeId: row.place_id,
    municipality: row.municipality,
    title: row.title,
    description: row.description,
    imageBefore: row.image_before,
    imageAfter: row.image_after,
    imagesBefore: row.images_before,
    imagesAfter: row.images_after,
    cost: row.cost,
    votes: row.votes,
    supporters: row.supporters,
    comments: row.comments,
    author: { ...fallbackAuthor, id: row.author_id },
    collaborators: [],
    category: row.category,
    createdAt: row.created_at,
  };
}

export const supabaseCityRepository: CityRepository = {
  listPlaces: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("places")
      .select("id, name, city, municipality, description, image, lat, lng, category, proposals(count)")
      .order("name");
    if (error) throw error;
    return (data as PlaceRow[] | null ?? []).map(toPlace);
  },

  getPlace: async id => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from("places")
      .select("id, name, city, municipality, description, image, lat, lng, category, proposals(count)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toPlace(data as PlaceRow) : undefined;
  },

  listProposals: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("proposals")
      .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ProposalRow[] | null ?? []).map(toProposal);
  },

  getProposal: async id => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from("proposals")
      .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toProposal(data as ProposalRow) : undefined;
  },

  listProposalsForPlace: async placeId => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("proposals")
      .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ProposalRow[] | null ?? []).map(toProposal);
  },
};
