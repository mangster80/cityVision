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

interface PublicProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  role: string | null;
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

function toProposal(row: ProposalRow, profile?: PublicProfileRow): Proposal {
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
    author: profile
      ? {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar_url || fallbackAuthor.avatar,
          bio: profile.bio || undefined,
          city: profile.city || undefined,
          neighborhood: profile.neighborhood || undefined,
          role: profile.role || undefined,
        }
      : { ...fallbackAuthor, id: row.author_id },
    collaborators: [],
    category: row.category,
    createdAt: row.created_at,
  };
}

const proposalSelect = "id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at";

async function getPublicProfiles(rows: ProposalRow[]) {
  if (!supabase) return new Map<string, PublicProfileRow>();

  const authorIds = [...new Set(rows.map(row => row.author_id))];
  if (authorIds.length === 0) return new Map<string, PublicProfileRow>();

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, name, avatar_url, bio, city, neighborhood, role")
    .in("id", authorIds);
  if (error) throw error;

  return new Map((data as PublicProfileRow[] | null ?? []).map(profile => [profile.id, profile]));
}

async function toProposals(rows: ProposalRow[]) {
  const profiles = await getPublicProfiles(rows);
  return rows.map(row => toProposal(row, profiles.get(row.author_id)));
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
      .select(proposalSelect)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return toProposals(data as ProposalRow[] | null ?? []);
  },

  getProposal: async id => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from("proposals")
      .select(proposalSelect)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? (await toProposals([data as ProposalRow]))[0] : undefined;
  },

  listProposalsForPlace: async placeId => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("proposals")
      .select(proposalSelect)
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return toProposals(data as ProposalRow[] | null ?? []);
  },
};
