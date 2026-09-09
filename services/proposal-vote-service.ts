"use client";

import { isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { getProposalInteraction, updateProposalInteraction, updateProposalVoteCount } from "@/services/proposal-interactions";

const demoVotesStorageKey = "cityvision-demo-proposal-votes";

function getDemoVotes(): Record<string, 1 | -1> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(demoVotesStorageKey);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, 1 | -1> : {};
  } catch {
    return {};
  }
}

function setDemoVotes(votes: Record<string, 1 | -1>) {
  window.localStorage.setItem(demoVotesStorageKey, JSON.stringify(votes));
}

export async function getProposalVote(proposalId: string): Promise<1 | -1 | 0> {
  if (isDemoLoginEnabled()) return getDemoVotes()[proposalId] ?? 0;
  if (!supabase) return 0;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return 0;
  const { data, error } = await supabase
    .from("proposal_votes")
    .select("value")
    .eq("proposal_id", proposalId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.value === 1 ? 1 : data?.value === -1 ? -1 : 0;
}

export async function toggleProposalVote(proposalId: string, nextVote: 1 | -1, currentVote: 1 | -1 | 0): Promise<{ vote: 1 | -1 | 0; votes: number }> {
  if (isDemoLoginEnabled()) {
    const votes = getDemoVotes();
    const interaction = getProposalInteraction(proposalId, { votes: 0, supporters: 0, comments: 0 });
    const nextValue = currentVote === nextVote ? 0 : nextVote;
    const nextVotes = interaction.votes + (nextValue - currentVote);
    if (nextValue === 0) delete votes[proposalId];
    else votes[proposalId] = nextValue;
    setDemoVotes(votes);
    updateProposalInteraction(proposalId, { ...interaction, votes: nextVotes });
    return { vote: nextValue as 1 | -1 | 0, votes: nextVotes };
  }
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Du måste vara inloggad för att rösta.");
  const query = supabase.from("proposal_votes");
  if (currentVote === nextVote) {
    const { error } = await query.delete().eq("proposal_id", proposalId).eq("user_id", authData.user.id);
    if (error) throw error;
  } else if (currentVote === 0) {
    const { error } = await query.insert({ proposal_id: proposalId, user_id: authData.user.id, value: nextVote });
    if (error) throw error;
  } else {
    const { error } = await query.update({ value: nextVote, updated_at: new Date().toISOString() }).eq("proposal_id", proposalId).eq("user_id", authData.user.id);
    if (error) throw error;
  }
  const { data: proposal, error: proposalError } = await supabase.from("proposals").select("votes").eq("id", proposalId).single();
  if (proposalError) throw proposalError;
  updateProposalVoteCount(proposalId, proposal.votes);
  return { vote: currentVote === nextVote ? 0 : nextVote, votes: proposal.votes };
}
