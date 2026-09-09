import { Place, Proposal } from "@/types";

export interface CityRepository {
  listPlaces(): Promise<Place[]>;
  getPlace(id: string): Promise<Place | undefined>;
  listProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  listProposalsForPlace(placeId: string): Promise<Proposal[]>;
  getWeeklyPlaceVotes(): Promise<Record<string, number>>;
}
