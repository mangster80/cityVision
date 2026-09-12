import { places, proposals } from "@/data/mock-data";
import { CityRepository } from "@/services/city-repository";
import {
  getDemoPlace,
  getDemoPlaces,
  getDemoProposal,
  getDemoProposals,
} from "@/services/demo-proposal-storage";

export const mockCityRepository: CityRepository = {
  listPlaces: async () => {
    const demo = getDemoPlaces();
    const demoProps = getDemoProposals();
    const base = places.map((p) => ({
      ...p,
      proposalCount:
        (p.proposalCount || 0) +
        demoProps.filter((dp) => dp.placeId === p.id).length,
    }));
    return [...demo, ...base];
  },
  getPlace: async (id) => {
    const demoPlace = getDemoPlace(id);
    if (demoPlace) return demoPlace;
    return places.find((place) => place.id === id);
  },
  listProposals: async () => {
    const demo = getDemoProposals();
    const base = proposals.map((proposal) => ({
      ...proposal,
      collaborators: [],
    }));
    return [...demo, ...base];
  },
  getProposal: async (id) => {
    const demo = getDemoProposal(id);
    if (demo) return demo;
    return proposals.find((proposal) => proposal.id === id);
  },
  listProposalsForPlace: async (placeId) => {
    const demo = getDemoProposals().filter((p) => p.placeId === placeId);
    const base = proposals.filter((proposal) => proposal.placeId === placeId);
    return [...demo, ...base];
  },
  getWeeklyPlaceVotes: async () => ({}),
};

