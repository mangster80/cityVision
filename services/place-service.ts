"use client";

import { useEffect, useState } from "react";
import { Place, Proposal } from "@/types";
import { supabase } from "@/services/supabase";

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

const fallbackAuthor = {
  id: "unknown",
  name: "CityVision member",
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

async function listPlaces(): Promise<Place[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("places")
    .select("id, name, city, municipality, description, image, lat, lng, category, proposals(count)")
    .order("name");
  if (error) throw error;
  return (data as PlaceRow[]).map(toPlace);
}

async function getPlace(id: string): Promise<Place | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("places")
    .select("id, name, city, municipality, description, image, lat, lng, category, proposals(count)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toPlace(data as PlaceRow) : null;
}

async function listProposalsForPlace(placeId: string): Promise<Proposal[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("proposals")
    .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProposalRow[]).map(toProposal);
}

async function listProposals(): Promise<Proposal[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("proposals")
    .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ProposalRow[]).map(toProposal);
}

async function getProposal(id: string): Promise<Proposal | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("proposals")
    .select("id, place_id, municipality, title, description, image_before, image_after, images_before, images_after, cost, votes, supporters, comments, author_id, category, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toProposal(data as ProposalRow) : null;
}

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listPlaces()
      .then(setPlaces)
      .catch(reason => setError(reason instanceof Error ? reason : new Error("Could not load places.")))
      .finally(() => setLoading(false));
  }, []);

  return { places, error, loading };
}

export function usePlaceDetail(id: string) {
  const [place, setPlace] = useState<Place | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getPlace(id), listProposalsForPlace(id)])
      .then(([nextPlace, nextProposals]) => {
        setPlace(nextPlace);
        setProposals(nextProposals);
      })
      .catch(reason => setError(reason instanceof Error ? reason : new Error("Could not load the place.")))
      .finally(() => setLoading(false));
  }, [id]);

  return { place, proposals, error, loading };
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listProposals()
      .then(setProposals)
      .catch(reason => setError(reason instanceof Error ? reason : new Error("Could not load proposals.")))
      .finally(() => setLoading(false));
  }, []);

  return { proposals, error, loading };
}

export function useProposalDetail(id: string) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getProposal(id)
      .then(async nextProposal => {
        setProposal(nextProposal);
        setPlace(nextProposal ? await getPlace(nextProposal.placeId) : null);
      })
      .catch(reason => setError(reason instanceof Error ? reason : new Error("Could not load the proposal.")))
      .finally(() => setLoading(false));
  }, [id]);

  return { proposal, place, error, loading };
}
