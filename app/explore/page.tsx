"use client";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { List, Map, Search, SlidersHorizontal, X } from "lucide-react";
import { usePlaces, useProposals } from "@/services/place-service";
import { PlaceCard, PlaceGridSkeleton, ProposalGrid, ProposalGridSkeleton } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { LocationSuggestion, searchMunicipalities } from "@/services/geocoding-service";

const CityMap = dynamic(() => import("@/components/city-map").then(module => module.CityMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Laddar karta...</div>
});

type SortOption = "popular" | "newest" | "support";

function ExploreContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "ALL";
  const rawSort = searchParams.get("sort");
  const urlSort: SortOption = rawSort === "newest" || rawSort === "support" ? rawSort : "popular";
  const urlView: "map" | "list" = searchParams.get("view") === "list" ? "list" : "map";

  const [filter, setFilter] = useState(urlCategory);
  const [sort, setSort] = useState<SortOption>(urlSort);
  const [query, setQuery] = useState(urlQuery);
  const [view, setView] = useState<"map" | "list">(urlView);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearchError, setLocationSearchError] = useState(false);

  const normalizedQuery = query.trim().toLocaleLowerCase("sv-SE");
  const normalizedSearchTerm = normalizedQuery.replace(/\s+(kommun|stad)$/u, "").trim();
  const { places: allPlaces, error: placesError, loading: placesLoading } = usePlaces();
  const { proposals: allProposals, error: proposalsError, loading: proposalsLoading } = useProposals();

  // Sync state changes back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filter !== "ALL") params.set("category", filter);
    if (sort !== "popular") params.set("sort", sort);
    if (view !== "map") params.set("view", view);

    const qs = params.toString();
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    const currentQs = searchParams.toString();
    const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname;

    if (targetUrl !== currentUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [query, filter, sort, view, pathname, router, searchParams]);

  useEffect(() => {
    const trimmedQuery = query.trim().toLocaleLowerCase("sv-SE");
    if (trimmedQuery.length < 1) {
      setLocationSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void searchMunicipalities(query, controller.signal)
        .then(apiSuggestions => {
          setLocationSuggestions(apiSuggestions);
        })
        .catch(error => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setLocationSearchError(true);
        });
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectLocation = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.municipality || suggestion.displayName);
    setLocationSuggestions([]);
    setLocationSearchError(false);
  };

  const matchingPlaces = useMemo(() => allPlaces.filter(place => {
    const matchesQuery = !normalizedSearchTerm || `${place.name} ${place.city} ${place.municipality} ${place.description}`.toLocaleLowerCase("sv-SE").includes(normalizedSearchTerm);
    return matchesQuery;
  }), [allPlaces, normalizedSearchTerm]);

  const matchingProposals = useMemo(() => allProposals.filter(proposal => {
    const place = allPlaces.find(candidate => candidate.id === proposal.placeId);
    return !normalizedSearchTerm || `${proposal.title} ${proposal.description} ${proposal.municipality} ${place?.name ?? ""} ${place?.city ?? ""}`.toLocaleLowerCase("sv-SE").includes(normalizedSearchTerm);
  }), [allPlaces, allProposals, normalizedSearchTerm]);

  const availableCategories = useMemo(() => {
    const categories = new Set([...matchingPlaces.map(place => place.category), ...matchingProposals.map(proposal => proposal.category)]);
    return Array.from(categories);
  }, [matchingPlaces, matchingProposals]);

  useEffect(() => {
    if (filter !== "ALL" && !availableCategories.includes(filter)) setFilter("ALL");
  }, [availableCategories, filter]);

  const places = useMemo(() => matchingPlaces.filter(place => {
    const matchesCategory = filter === "ALL" || place.category === filter;
    return matchesCategory;
  }), [filter, matchingPlaces]);

  const proposals = useMemo(() => {
    const list = matchingProposals.filter(proposal => {
      const matchesCategory = filter === "ALL" || proposal.category === filter;
      return matchesCategory;
    });
    return [...list].sort((a, b) => sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : sort === "support" ? b.supporters - a.supporters : b.votes - a.votes);
  }, [filter, matchingProposals, sort]);

  return (
    <main className="min-h-screen px-5 pb-20 pt-32 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("explore.discover-your-city")}</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("explore.header")}</h1>
            <p className="mt-3 text-slate-500">{t("explore.description")}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${view === "map" ? "bg-[#7056d8] text-white dark:bg-white dark:text-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}
            >
              <Map size={16} className="mr-2 inline"/> {t("explore.map")}
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${view === "list" ? "bg-[#7056d8] text-white dark:bg-white dark:text-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}
            >
              <List size={16} className="mr-2 inline"/> {t("explore.list")}
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className={`relative h-[340px] overflow-hidden rounded-3xl border border-black/10 shadow-inner dark:border-white/10 ${view === "list" ? "hidden" : ""}`}>
            <CityMap places={allPlaces} onPlaceSelect={place => setQuery(place.name)} />
          </div>
          <div className={`space-y-3 ${view === "list" ? "lg:col-span-2" : ""}`}>
            <div className="relative flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7056d8]/60 focus-within:ring-4 focus-within:ring-[#7056d8]/10 dark:border-white/15 dark:bg-[#201b35] dark:shadow-black/20">
              <Search size={17} className="shrink-0 text-slate-400 dark:text-slate-300"/>
              <input
                value={query}
                onChange={event => { setQuery(event.target.value); setLocationSearchError(false); }}
                placeholder={t("explore.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
              />
              {locationSuggestions.length > 0 && (
                <div className="absolute left-10 right-12 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">
                  {locationSuggestions.map(suggestion => (
                    <button
                      key={`${suggestion.latitude}-${suggestion.longitude}`}
                      type="button"
                      onClick={() => selectLocation(suggestion)}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10"
                    >
                      {suggestion.municipality || suggestion.displayName}
                    </button>
                  ))}
                </div>
              )}
              {locationSearchError && (
                <p className="absolute left-0 top-full mt-2 text-xs text-slate-500">{t("explore.location-suggestions-are-unavailable-right-now")}</p>
              )}
              {query && (
                <button
                  type="button"
                  aria-label={t("explore.clear-search")}
                  onClick={() => setQuery("")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={15}/>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === "ALL" ? "bg-[#7056d8] text-white dark:bg-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}
              >
                {t("explore.all")}
              </button>
              {availableCategories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === c ? "bg-[#7056d8] text-white dark:bg-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-slate-400">
                {proposalsLoading ? t("explore.loadingProposals") : `${proposals.length} ${t("explore.proposalsFound")}`}
              </span>
              <label className="flex items-center gap-2 text-sm text-slate-500">
                <SlidersHorizontal size={15}/>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="bg-transparent font-semibold text-ink outline-none dark:text-white"
                >
                  <option value="popular">{t("explore.mostPopular")}</option>
                  <option value="newest">{t("explore.newest")}</option>
                  <option value="support">{t("explore.mostSupport")}</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {proposalsError && <p role="alert" className="text-sm text-red-600">{t("explore.proposalsError")}: {proposalsError.message}</p>}
        {proposalsLoading ? (
          <ProposalGridSkeleton count={6} compact />
        ) : (
          <ProposalGrid proposals={proposals} compact imageMode="before" priorityCount={3} emptyMessage={t("explore.noMatchingProposals")}/>
        )}

        <h2 className="mb-5 mt-20 text-2xl font-semibold">{t("explore.placesHeader")}</h2>
        {placesError && <p role="alert" className="text-sm text-red-600">{t("explore.placesError")}: {placesError.message}</p>}
        {placesLoading ? (
          <PlaceGridSkeleton count={4} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {places.map(p => <PlaceCard key={p.id} place={p}/>)}
            {places.length === 0 && <p className="text-sm text-slate-500">{t("explore.emptyPlaces")}</p>}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Explore() {
  return (
    <Suspense fallback={
      <main className="min-h-screen px-5 pb-20 pt-32 sm:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="skeleton-shimmer h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <ProposalGridSkeleton count={6} compact />
        </div>
      </main>
    }>
      <ExploreContent />
    </Suspense>
  );
}
