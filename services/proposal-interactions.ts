"use client";

import { supabase } from "@/services/supabase";

export interface ProposalInteraction {
  votes: number;
  supporters: number;
  comments: number;
}

interface StoredProposalInteraction {
  votes?: number;
  supporters?: number;
  comments?: number;
}

const storageKey = "cityvision-proposal-interactions";
const changeEvent = "cityvision-proposal-change";

function readInteractions(): Record<string, StoredProposalInteraction> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, StoredProposalInteraction> : {};
  } catch {
    return {};
  }
}

export function getProposalInteraction(id: string, defaults: ProposalInteraction): ProposalInteraction {
  const stored = readInteractions()[id];
  return {
    votes: stored?.votes ?? defaults.votes,
    supporters: stored?.supporters ?? defaults.supporters,
    comments: stored?.comments ?? defaults.comments
  };
}

export function updateProposalInteraction(id: string, interaction: ProposalInteraction) {
  const interactions = readInteractions();
  interactions[id] = interaction;
  window.localStorage.setItem(storageKey, JSON.stringify(interactions));
  window.dispatchEvent(new Event(changeEvent));
}

export function updateProposalVoteCount(id: string, votes: number) {
  const interactions = readInteractions();
  interactions[id] = { ...interactions[id], votes };
  window.localStorage.setItem(storageKey, JSON.stringify(interactions));
  window.dispatchEvent(new Event(changeEvent));
}

export function updateProposalSupporterCount(id: string, supporters: number) {
  const interactions = readInteractions();
  interactions[id] = { ...interactions[id], supporters };
  window.localStorage.setItem(storageKey, JSON.stringify(interactions));
  window.dispatchEvent(new Event(changeEvent));
}

export function updateProposalCommentCount(id: string, comments: number) {
  const interactions = readInteractions();
  interactions[id] = { ...interactions[id], comments };
  window.localStorage.setItem(storageKey, JSON.stringify(interactions));
  window.dispatchEvent(new Event(changeEvent));
}

export function proposalChangeEventName() {
  return changeEvent;
}

export function subscribeToProposalInteractions(
  proposalId: string,
  onUpdate?: (interaction: Partial<ProposalInteraction>) => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      window.dispatchEvent(new Event(changeEvent));
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  const client = supabase;
  if (!client) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }

  const channel = client
    .channel(`realtime-proposal-interactions-${proposalId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "proposals",
        filter: `id=eq.${proposalId}`,
      },
      (payload) => {
        const updated = payload.new as {
          votes?: number;
          supporters?: number;
          comments?: number;
        };

        const interactions = readInteractions();
        const current = interactions[proposalId] ?? {};
        const next: StoredProposalInteraction = {
          ...current,
          ...(typeof updated.votes === "number" ? { votes: updated.votes } : {}),
          ...(typeof updated.supporters === "number" ? { supporters: updated.supporters } : {}),
          ...(typeof updated.comments === "number" ? { comments: updated.comments } : {}),
        };

        interactions[proposalId] = next;
        window.localStorage.setItem(storageKey, JSON.stringify(interactions));
        window.dispatchEvent(new Event(changeEvent));
        onUpdate?.(next);
      }
    )
    .subscribe();

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
    void client.removeChannel(channel);
  };
}
