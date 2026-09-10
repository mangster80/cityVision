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
  proposalCount?: number;
}

interface ProposalRow {
  id: string;
  place_id: string;
  municipality: string;
  title: string;
  description: string;
  image_before?: string;
  image_after?: string;
  images_before?: string[];
  images_after?: string[];
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

interface CollaboratorRow {
  proposal_id: string;
  user_id: string;
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
    proposalCount: row.proposalCount ?? 0,
  };
}

function toUser(profile: PublicProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url || fallbackAuthor.avatar,
    bio: profile.bio || undefined,
    city: profile.city || undefined,
    neighborhood: profile.neighborhood || undefined,
    role: profile.role || undefined,
  };
}

function toProposal(row: ProposalRow, profile: PublicProfileRow | undefined, collaborators: User[]): Proposal {
  return {
    id: row.id,
    placeId: row.place_id,
    municipality: row.municipality,
    title: row.title,
    description: row.description,
    imageBefore: row.image_before || proposalImageFallback,
    imageAfter: row.image_after || proposalImageFallback,
    imagesBefore: row.images_before,
    imagesAfter: row.images_after,
    cost: row.cost,
    votes: row.votes,
    supporters: row.supporters,
    comments: row.comments,
    author: profile
      ? toUser(profile)
      : { ...fallbackAuthor, id: row.author_id },
    collaborators,
    category: row.category,
    createdAt: row.created_at,
  };
}

const proposalSelect = "id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at";
const proposalListSelect = "id, place_id, municipality, title, description, cost, votes, supporters, comments, author_id, category, created_at";
const proposalImageFallback = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=75";

async function getPublicProfilesByIds(authorIds: string[]) {
  if (!supabase) return new Map<string, PublicProfileRow>();

  const uniqueIds = [...new Set(authorIds)];
  if (uniqueIds.length === 0) return new Map<string, PublicProfileRow>();

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, name, avatar_url, bio, city, neighborhood, role")
    .in("id", uniqueIds);
  if (error) throw error;

  return new Map((data as PublicProfileRow[] | null ?? []).map(profile => [profile.id, profile]));
}

async function getPublicProfiles(rows: ProposalRow[]) {
  return getPublicProfilesByIds(rows.map(row => row.author_id));
}

async function getCollaborators(rows: ProposalRow[]) {
  if (!supabase || rows.length === 0) return new Map<string, User[]>();

  const proposalIds = rows.map(row => row.id);
  const { data, error } = await supabase
    .from("proposal_collaborators")
    .select("proposal_id, user_id")
    .in("proposal_id", proposalIds);
  if (error) throw error;

  const collaboratorRows = data as CollaboratorRow[] | null ?? [];
  const profiles = await getPublicProfilesByIds(collaboratorRows.map(row => row.user_id));
  const collaboratorsByProposal = new Map<string, User[]>();
  for (const row of collaboratorRows) {
    const profile = profiles.get(row.user_id);
    if (!profile) continue;
    const collaborators = collaboratorsByProposal.get(row.proposal_id) ?? [];
    collaborators.push(toUser(profile));
    collaboratorsByProposal.set(row.proposal_id, collaborators);
  }
  return collaboratorsByProposal;
}

async function toProposals(rows: ProposalRow[]) {
  const profiles = await getPublicProfiles(rows);
  const collaborators = await getCollaborators(rows);
  return rows.map(row => toProposal(row, profiles.get(row.author_id), collaborators.get(row.id) ?? []));
}

export const supabaseCityRepository: CityRepository = {
  listPlaces: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("places")
      .select("id, name, city, municipality, description, image, lat, lng, category")
      .order("name");
    if (error) throw error;
    const rows = data as PlaceRow[] | null ?? [];
    const { data: proposalRows, error: proposalError } = await supabase
      .from("proposals")
      .select("place_id");
    if (proposalError) throw proposalError;
    const proposalCounts = new Map<string, number>();
    for (const row of proposalRows as { place_id: string }[] | null ?? []) {
      proposalCounts.set(row.place_id, (proposalCounts.get(row.place_id) ?? 0) + 1);
    }
    return rows.map(row => toPlace({ ...row, proposalCount: proposalCounts.get(row.id) ?? 0 }));
  },

  getPlace: async id => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from("places")
      .select("id, name, city, municipality, description, image, lat, lng, category")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    const { count, error: proposalError } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("place_id", id);
    if (proposalError) throw proposalError;
    return toPlace({ ...(data as PlaceRow), proposalCount: count ?? 0 });
  },

  listProposals: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("proposals")
      .select(proposalListSelect)
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
    if (!data) return undefined;
    const { count: commentCount, error: commentError } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", id);
    if (commentError) throw commentError;
    return (await toProposals([{ ...data, comments: commentCount ?? 0 } as ProposalRow]))[0];
  },

  listProposalsForPlace: async placeId => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("proposals")
      .select(proposalListSelect)
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return toProposals(data as ProposalRow[] | null ?? []);
  },

  getWeeklyPlaceVotes: async () => {
    if (!supabase) return {};
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: voteData, error: voteError } = await supabase
      .from("proposal_votes")
      .select("proposal_id")
      .eq("value", 1)
      .gte("created_at", since);
    if (voteError) throw voteError;

    const proposalIds = [...new Set((voteData as { proposal_id: string }[] | null ?? []).map(row => row.proposal_id))];
    if (proposalIds.length === 0) return {};

    const { data: proposalData, error: proposalError } = await supabase
      .from("proposals")
      .select("id, place_id")
      .in("id", proposalIds);
    if (proposalError) throw proposalError;

    const placeByProposal = new Map(
      (proposalData as { id: string; place_id: string }[] | null ?? []).map(row => [row.id, row.place_id])
    );
    return (voteData as { proposal_id: string }[] | null ?? []).reduce<Record<string, number>>((totals, vote) => {
      const placeId = placeByProposal.get(vote.proposal_id);
      if (!placeId) return totals;
      totals[placeId] = (totals[placeId] ?? 0) + 1;
      return totals;
    }, {});
  },
};
