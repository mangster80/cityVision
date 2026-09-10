import { places, proposals } from "@/data/mock-data";
import { CityRepository } from "@/services/city-repository";

export const mockCityRepository: CityRepository = {
  listPlaces: async () => places,
  getPlace: async id => places.find(place => place.id === id),
  listProposals: async () => proposals.map(proposal => ({ ...proposal, collaborators: [] })),
  getProposal: async id => proposals.find(proposal => proposal.id === id),
  listProposalsForPlace: async placeId => proposals.filter(proposal => proposal.placeId === placeId),
  getWeeklyPlaceVotes: async () => ({})
};
