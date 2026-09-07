interface ProposalInteraction {
  votes: number;
  supporters: number;
}

const storageKey = "cityvision-proposal-interactions";
const changeEvent = "cityvision-proposal-change";

function readInteractions(): Record<string, ProposalInteraction> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, ProposalInteraction> : {};
  } catch {
    return {};
  }
}

export function getProposalInteraction(id: string, defaults: ProposalInteraction) {
  return readInteractions()[id] ?? defaults;
}

export function updateProposalInteraction(id: string, interaction: ProposalInteraction) {
  const interactions = readInteractions();
  interactions[id] = interaction;
  window.localStorage.setItem(storageKey, JSON.stringify(interactions));
  window.dispatchEvent(new Event(changeEvent));
}

export function proposalChangeEventName() {
  return changeEvent;
}
