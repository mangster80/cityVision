"use client";

import { supabase } from "@/services/supabase";
import { isDemoLoginEnabled } from "@/services/user-storage";

const demoSupportStorageKey = "cityvision-demo-proposal-support";

function getDemoSupports() {
  if (typeof window === "undefined") return new Set<string>();
  const raw = window.localStorage.getItem(demoSupportStorageKey);
  if (!raw) return new Set<string>();
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is string => typeof id === "string")) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function setDemoSupports(supports: Set<string>) {
  window.localStorage.setItem(demoSupportStorageKey, JSON.stringify([...supports]));
}

export async function toggleProposalSupport(proposalId: string) {
  if (isDemoLoginEnabled()) {
    const supports = getDemoSupports();
    if (supports.has(proposalId)) {
      supports.delete(proposalId);
      setDemoSupports(supports);
      return false;
    }
    supports.add(proposalId);
    setDemoSupports(supports);
    return true;
  }
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Logga in för att stödja ett förslag.");

  const { data: existingSupport, error: readError } = await supabase
    .from("proposal_supports")
    .select("proposal_id")
    .eq("proposal_id", proposalId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (readError) throw readError;

  if (existingSupport) {
    const { error } = await supabase
      .from("proposal_supports")
      .delete()
      .eq("proposal_id", proposalId)
      .eq("user_id", authData.user.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from("proposal_supports")
    .insert({ proposal_id: proposalId, user_id: authData.user.id });
  if (error) throw error;
  return true;
}

export async function listSupportedProposalIds(userId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("proposal_supports")
    .select("proposal_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map(support => support.proposal_id));
}

export async function hasProposalSupport(proposalId: string) {
  if (isDemoLoginEnabled()) return getDemoSupports().has(proposalId);
  if (!supabase) return false;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return false;

  const { data, error } = await supabase
    .from("proposal_supports")
    .select("proposal_id")
    .eq("proposal_id", proposalId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
