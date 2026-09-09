"use client";

import { useCallback, useEffect, useState } from "react";
import { Place, Proposal } from "@/types";
import { cityService } from "@/services/city-service";

function useAsyncValue<T>(load: () => Promise<T>, fallback: T, errorMessage: string) {
  const [value, setValue] = useState(fallback);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load()
      .then(setValue)
      .catch(reason => setError(reason instanceof Error ? reason : new Error(errorMessage)))
      .finally(() => setLoading(false));
  }, [load, errorMessage]);

  return { value, error, loading };
}

export function usePlaces() {
  const load = useCallback(() => cityService.getPlaces(), []);
  const result = useAsyncValue(load, [], "Could not load places.");
  return { places: result.value, error: result.error, loading: result.loading };
}

export function usePlaceDetail(id: string) {
  const load = useCallback(() => Promise.all([cityService.getPlace(id), cityService.getPlaceProposals(id)]), [id]);
  const result = useAsyncValue(
    load,
    [undefined, []] as [Place | undefined, Proposal[]],
    "Could not load the place."
  );
  return { place: result.value[0] ?? null, proposals: result.value[1], error: result.error, loading: result.loading };
}

export function useProposals() {
  const load = useCallback(() => cityService.getProposals(), []);
  const result = useAsyncValue(load, [], "Could not load proposals.");
  return { proposals: result.value, error: result.error, loading: result.loading };
}

export function useProposalDetail(id: string) {
  const load = useCallback(async () => {
    const proposal = await cityService.getProposal(id);
    return { proposal: proposal ?? null, place: proposal ? (await cityService.getPlace(proposal.placeId)) ?? null : null };
  }, [id]);
  const result = useAsyncValue(
    load,
    { proposal: null, place: null } as { proposal: Proposal | null; place: Place | null },
    "Could not load the proposal."
  );
  return { ...result.value, error: result.error, loading: result.loading };
}
