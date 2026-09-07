import { Place, Proposal } from "@/types";
import { CityRepository } from "@/services/city-repository";
import { mockCityRepository } from "@/services/mock-city-repository";

export const createCityService = (repository: CityRepository) => ({
  getPlaces: (): Place[] => repository.listPlaces(),
  getPlace: (id: string): Place | undefined => repository.getPlace(id),
  getProposals: (): Proposal[] => repository.listProposals(),
  getProposal: (id: string): Proposal | undefined => repository.getProposal(id),
  getPlaceProposals: (placeId: string): Proposal[] => repository.listProposalsForPlace(placeId)
});

export const cityService = createCityService(mockCityRepository);
