import { Place, Proposal, ProposalStatus, User } from "@/types";
import { getStoredUser } from "@/services/user-storage";
import { places as mockPlaces, proposals as mockProposals, users } from "@/data/mock-data";

const demoProposalsStorageKey = "cityvision-demo-proposals";
const demoPlacesStorageKey = "cityvision-demo-places";

const defaultFallbackImage =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=75";

export function getDemoProposals(): Proposal[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(demoProposalsStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Proposal[];
  } catch {
    return [];
  }
}

export function getDemoProposal(id: string): Proposal | undefined {
  const custom = getDemoProposals().find((p) => p.id === id);
  if (custom) return custom;
  return mockProposals.find((p) => p.id === id);
}

export function saveDemoProposal(proposal: Proposal): void {
  if (typeof window === "undefined") return;
  const existing = getDemoProposals();
  const filtered = existing.filter((p) => p.id !== proposal.id);
  try {
    window.localStorage.setItem(
      demoProposalsStorageKey,
      JSON.stringify([proposal, ...filtered])
    );
  } catch (error) {
    // If storage quota exceeded due to large base64 images, strip heavy images and retry
    const lightweight: Proposal = {
      ...proposal,
      imageBefore: proposal.imageBefore.startsWith("data:")
        ? defaultFallbackImage
        : proposal.imageBefore,
      imageAfter: proposal.imageAfter.startsWith("data:")
        ? defaultFallbackImage
        : proposal.imageAfter,
      imagesBefore: undefined,
      imagesAfter: undefined,
    };
    try {
      window.localStorage.setItem(
        demoProposalsStorageKey,
        JSON.stringify([lightweight, ...filtered])
      );
    } catch {
      console.warn("Could not persist demo proposal to localStorage", error);
    }
  }

  window.dispatchEvent(new Event("cityvision-proposal-change"));
}

export function deleteDemoProposal(proposalId: string): boolean {
  if (typeof window === "undefined") return false;
  const existing = getDemoProposals();
  const next = existing.filter((p) => p.id !== proposalId);
  window.localStorage.setItem(demoProposalsStorageKey, JSON.stringify(next));
  window.dispatchEvent(new Event("cityvision-proposal-change"));
  return existing.length !== next.length;
}

export function updateDemoProposalStatus(
  proposalId: string,
  status: ProposalStatus,
  statusNote?: string
): void {
  if (typeof window === "undefined") return;
  const proposals = getDemoProposals();
  const index = proposals.findIndex((p) => p.id === proposalId);
  if (index >= 0) {
    proposals[index] = {
      ...proposals[index],
      status,
      statusNote: statusNote?.trim() || undefined,
      statusUpdatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      demoProposalsStorageKey,
      JSON.stringify(proposals)
    );
    window.dispatchEvent(new Event("cityvision-proposal-change"));
  }
}

export function getDemoPlaces(): Place[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(demoPlacesStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Place[];
  } catch {
    return [];
  }
}

export function getDemoPlace(id: string): Place | undefined {
  const custom = getDemoPlaces().find((p) => p.id === id);
  if (custom) return custom;
  return mockPlaces.find((p) => p.id === id);
}

export function saveDemoPlace(place: Place): void {
  if (typeof window === "undefined") return;
  const existing = getDemoPlaces();
  const filtered = existing.filter((p) => p.id !== place.id);
  try {
    window.localStorage.setItem(
      demoPlacesStorageKey,
      JSON.stringify([place, ...filtered])
    );
  } catch (error) {
    console.warn("Could not persist demo place to localStorage", error);
  }
}

export function createDemoProposal(input: {
  placeName: string;
  municipality: string;
  title: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  problem: string;
  idea: string;
  cost: string;
  beforeImages: string[];
  afterImages: string[];
}): string {
  const storedUser = getStoredUser();
  const author: User = storedUser ?? {
    id: "u1",
    name: "Demouser",
    avatar: users[0]?.avatar || defaultFallbackImage,
    role: "Stadsengagerad invånare",
    city: input.municipality || "Stockholm",
    neighborhood: "Centrum",
  };

  const id = `demo-${crypto.randomUUID()}`;
  const placeName = input.placeName.trim();
  const municipality = input.municipality.trim() || "Stockholm";
  const category = input.category.trim() || "Plats";

  // Find or create place
  const existingDemoPlaces = getDemoPlaces();
  const existingMockPlaces = mockPlaces;
  const allKnownPlaces = [...existingDemoPlaces, ...existingMockPlaces];

  const matchedPlace = allKnownPlaces.find(
    (p) =>
      p.name.toLowerCase() === placeName.toLowerCase() &&
      p.municipality.toLowerCase() === municipality.toLowerCase()
  );

  let placeId = matchedPlace?.id;
  const imageBefore =
    input.beforeImages[0] ||
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=75";
  const imageAfter =
    input.afterImages[0] ||
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=75";

  if (!placeId) {
    placeId = `place-${crypto.randomUUID()}`;
    const newPlace: Place = {
      id: placeId,
      name: placeName,
      city: municipality,
      municipality,
      description: input.problem.trim() || input.idea.trim(),
      image: imageBefore,
      lat: input.latitude ?? 59.3293,
      lng: input.longitude ?? 18.0686,
      category,
      proposalCount: 1,
    };
    saveDemoPlace(newPlace);
  }

  const description = input.problem.trim()
    ? `${input.problem.trim()}\n\n${input.idea.trim()}`
    : input.idea.trim();

  const newProposal: Proposal = {
    id,
    placeId,
    municipality,
    title: input.title.trim(),
    description,
    imageBefore,
    imageAfter,
    imagesBefore: input.beforeImages.length > 0 ? input.beforeImages : [imageBefore],
    imagesAfter: input.afterImages.length > 0 ? input.afterImages : [imageAfter],
    cost: Number(input.cost) || 0,
    votes: 1,
    supporters: 1,
    comments: 0,
    author,
    collaborators: [],
    category,
    createdAt: new Date().toISOString(),
    status: "idea",
    statusUpdatedAt: new Date().toISOString(),
  };

  saveDemoProposal(newProposal);
  return id;
}
