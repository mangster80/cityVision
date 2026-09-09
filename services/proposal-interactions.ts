export interface ProposalInteraction {
  votes: number;
  supporters: number;
}

interface StoredProposalInteraction {
  votes?: number;
  supporters?: number;
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
    supporters: stored?.supporters ?? defaults.supporters
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

export function proposalChangeEventName() {
  return changeEvent;
}
