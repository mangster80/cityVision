import { Place, Proposal } from "@/types";

export interface CityRepository {
  listPlaces(): Place[];
  getPlace(id: string): Place | undefined;
  listProposals(): Proposal[];
  getProposal(id: string): Proposal | undefined;
  listProposalsForPlace(placeId: string): Proposal[];
}
