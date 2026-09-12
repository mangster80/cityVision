import { Place, Proposal } from "@/types";
import { CityRepository } from "@/services/city-repository";
import { mockCityRepository } from "@/services/mock-city-repository";
import { supabaseCityRepository } from "@/services/supabase-city-repository";
import { supabase } from "@/services/supabase";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function createCityService(repository: CityRepository) {
  const cache = new Map<string, CacheEntry<unknown>>();
  const CACHE_TTL = 30_000; // 30 seconds client-side cache

  async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const entry = cache.get(key);
    const now = Date.now();
    if (entry && now - entry.timestamp < CACHE_TTL) {
      return entry.data as T;
    }
    const data = await fetcher();
    cache.set(key, { data, timestamp: now });
    return data;
  }

  function invalidateCache() {
    cache.clear();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("cityvision-proposal-change", invalidateCache);
    window.addEventListener("cityvision-auth-change", invalidateCache);
    window.addEventListener("cityvision-auth-login", invalidateCache);
  }

  return {
    getPlaces: async (): Promise<Place[]> => getCached("places", () => repository.listPlaces()),
    getPlace: async (id: string): Promise<Place | undefined> => getCached(`place:${id}`, () => repository.getPlace(id)),
    getProposals: async (): Promise<Proposal[]> => getCached("proposals", () => repository.listProposals()),
    getProposal: async (id: string): Promise<Proposal | undefined> => getCached(`proposal:${id}`, () => repository.getProposal(id)),
    getPlaceProposals: async (placeId: string): Promise<Proposal[]> => getCached(`place-proposals:${placeId}`, () => repository.listProposalsForPlace(placeId)),
    getWeeklyPlaceVotes: async (): Promise<Record<string, number>> => getCached("weekly-votes", () => repository.getWeeklyPlaceVotes()),
    invalidateCache,
  };
}

export const cityService = createCityService(supabase ? supabaseCityRepository : mockCityRepository);
