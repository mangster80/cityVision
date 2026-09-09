import { Place, Proposal } from "@/types";
import { CityRepository } from "@/services/city-repository";
import { mockCityRepository } from "@/services/mock-city-repository";
import { supabaseCityRepository } from "@/services/supabase-city-repository";
import { supabase } from "@/services/supabase";

export const createCityService = (repository: CityRepository) => ({
  getPlaces: async (): Promise<Place[]> => repository.listPlaces(),
  getPlace: async (id: string): Promise<Place | undefined> => repository.getPlace(id),
  getProposals: async (): Promise<Proposal[]> => repository.listProposals(),
  getProposal: async (id: string): Promise<Proposal | undefined> => repository.getProposal(id),
  getPlaceProposals: async (placeId: string): Promise<Proposal[]> => repository.listProposalsForPlace(placeId),
  getWeeklyPlaceVotes: async (): Promise<Record<string, number>> => repository.getWeeklyPlaceVotes()
});

export const cityService = createCityService(supabase ? supabaseCityRepository : mockCityRepository);
