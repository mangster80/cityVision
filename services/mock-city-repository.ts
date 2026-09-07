import { places, proposals } from "@/data/mock-data";
import { CityRepository } from "@/services/city-repository";

export const mockCityRepository: CityRepository = {
  listPlaces: () => places,
  getPlace: id => places.find(place => place.id === id),
  listProposals: () => proposals,
  getProposal: id => proposals.find(proposal => proposal.id === id),
  listProposalsForPlace: placeId => proposals.filter(proposal => proposal.placeId === placeId)
};
