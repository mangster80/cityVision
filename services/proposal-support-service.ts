"use client";

import { supabase } from "@/services/supabase";

export async function toggleProposalSupport(proposalId: string) {
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
