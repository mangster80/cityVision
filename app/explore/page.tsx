"use client";
import dynamic from "next/dynamic";
import { KeyboardEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, List, Loader2, LocateFixed, Map, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { usePlaces, useProposals } from "@/services/place-service";
import { PlaceCard, PlaceGridSkeleton, ProposalGrid, ProposalGridSkeleton } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { Place } from "@/types";
import { LocationSuggestion, POPULAR_MUNICIPALITIES, reverseGeocode, searchMunicipalities } from "@/services/geocoding-service";
import { getDistanceFromLatLonInKm } from "@/lib/distance";
import { PROPOSAL_STATUS_STEPS, getStatusBadgeClasses } from "@/lib/proposal-status-config";
import { CATEGORY_CONFIGS, getCategoryConfig } from "@/lib/category-config";
import { extractSearchTokens, filterAndRankPlaces, filterAndRankProposals, normalizeSearchText } from "@/lib/search-utils";

const CityMap = dynamic(() => import("@/components/city-map").then(module => module.CityMap), {
  ssr: false,
  loading: () => <div className="skeleton-shimmer h-full w-full bg-slate-200 dark:bg-[#201b35]" />
});

type SortOption = "popular" | "newest" | "support";

function ExploreContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "ALL";
  const urlStatus = searchParams.get("status") ?? "ALL";
  const rawSort = searchParams.get("sort");
  const urlSort: SortOption = rawSort === "newest" || rawSort === "support" ? rawSort : "popular";
  const urlView: "map" | "list" = searchParams.get("view") === "list" ? "list" : "map";

  const [filter, setFilter] = useState(urlCategory);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [sort, setSort] = useState<SortOption>(urlSort);
  const [query, setQuery] = useState(urlQuery);
  const [view, setView] = useState<"map" | "list">(urlView);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom?: number; placeId?: string } | null>(null);
  const [focusBounds, setFocusBounds] = useState<[number, number][] | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const lastNearMeClickTime = useRef(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { places: allPlaces, error: placesError, loading: placesLoading } = usePlaces();
  const { proposals: allProposals, error: proposalsError, loading: proposalsLoading } = useProposals();

  // Sync state changes back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filter !== "ALL") params.set("category", filter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (sort !== "popular") params.set("sort", sort);
    if (view !== "map") params.set("view", view);

    const qs = params.toString();
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    const currentQs = searchParams.toString();
    const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname;

    if (targetUrl !== currentUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [query, filter, statusFilter, sort, view, pathname, router, searchParams]);

  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setLocationSuggestions([]);
        setIsSearchFocused(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 1) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      setHighlightedIndex(-1);
      return;
    }
    setIsSearchingLocation(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void searchMunicipalities(query, controller.signal)
        .then(apiSuggestions => {
          setLocationSuggestions(apiSuggestions);
          setHighlightedIndex(-1);
          setIsSearchingLocation(false);
        })
        .catch(error => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setLocationSearchError(true);
          setIsSearchingLocation(false);
        });
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectLocation = (suggestion: LocationSuggestion) => {
    const munName = suggestion.municipality || suggestion.displayName;
    setQuery(munName);
    setSelectedPlaceId(null);

    // Zoom map into matching places in this municipality or directly to coordinates
    const normMun = normalizeSearchText(suggestion.municipality);
    const munPlaces = allPlaces.filter(p => {
      const pMun = normalizeSearchText(p.municipality || "");
      const pCity = normalizeSearchText(p.city || "");
      return pMun.includes(normMun) || normMun.includes(pMun) || pCity.includes(normMun) || normMun.includes(pCity);
    });

    if (munPlaces.length > 1) {
      setFocusBounds(munPlaces.map(p => [p.lat, p.lng]));
      setFocusLocation(null);
    } else if (munPlaces.length === 1) {
      setFocusLocation({ lat: munPlaces[0].lat, lng: munPlaces[0].lng, zoom: 16, placeId: munPlaces[0].id });
      setSelectedPlaceId(munPlaces[0].id);
      setFocusBounds(null);
    } else {
      setFocusLocation({ lat: suggestion.latitude, lng: suggestion.longitude, zoom: 12 });
      setFocusBounds(null);
    }

    setLocationSuggestions([]);
    setIsSearchFocused(false);
    setHighlightedIndex(-1);
    setLocationSearchError(false);
    setGeoError(null);
  };

  const selectPlace = (placeOrName: Place | string) => {
    const targetPlace = typeof placeOrName === "string"
      ? allPlaces.find(p => p.name.toLocaleLowerCase("sv-SE") === placeOrName.toLocaleLowerCase("sv-SE")) ||
        allPlaces.find(p => normalizeSearchText(p.name) === normalizeSearchText(placeOrName))
      : placeOrName;

    if (targetPlace) {
      setQuery(targetPlace.name);
      setSelectedPlaceId(targetPlace.id);
      setFocusLocation({ lat: targetPlace.lat, lng: targetPlace.lng, zoom: 16, placeId: targetPlace.id });
      setFocusBounds(null);
    } else {
      setQuery(typeof placeOrName === "string" ? placeOrName : "");
    }

    setLocationSuggestions([]);
    setIsSearchFocused(false);
    setHighlightedIndex(-1);
    setLocationSearchError(false);
    setGeoError(null);
  };

  const handleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserLocation(null);
      setFocusLocation(null);
      setFocusBounds(null);
      setSelectedPlaceId(null);
      setQuery("");
      return;
    }

    if (locatingUser) return;

    // Throttle repeated clicks to prevent spamming geolocation API
    const now = Date.now();
    if (now - lastNearMeClickTime.current < 2500) {
      return;
    }
    lastNearMeClickTime.current = now;

    if (!navigator.geolocation) {
      setGeoError(t("explore.location-not-found"));
      return;
    }

    setLocatingUser(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setUserLocation([latitude, longitude]);
        setFocusLocation({ lat: latitude, lng: longitude, zoom: 13 });
        setFocusBounds(null);
        setSelectedPlaceId(null);
        setNearMeActive(true);

        try {
          // Attempt reverse geocoding first to find exact Swedish municipality
          const rev = await reverseGeocode(latitude, longitude);
          if (rev?.municipality) {
            setQuery(rev.municipality);
            setLocatingUser(false);
            return;
          }
        } catch {
          // Ignore and fallback to nearest place in dataset
        }

        // Fallback: Find closest place in our dataset
        if (allPlaces.length > 0) {
          let closest = allPlaces[0];
          let minDistance = getDistanceFromLatLonInKm(latitude, longitude, closest.lat, closest.lng);

          for (let i = 1; i < allPlaces.length; i++) {
            const dist = getDistanceFromLatLonInKm(latitude, longitude, allPlaces[i].lat, allPlaces[i].lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = allPlaces[i];
            }
          }

          setQuery(closest.municipality || closest.city);
        } else {
          setGeoError(t("explore.location-not-found"));
        }

        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
        setNearMeActive(false);
        setGeoError(t("explore.location-not-found"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Smart matching suggestions for places
  const matchingPlaceSuggestions = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    return filterAndRankPlaces(allPlaces, query).slice(0, 4);
  }, [allPlaces, query]);

  const combinedSuggestionsCount = locationSuggestions.length + matchingPlaceSuggestions.length;

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const totalCount = combinedSuggestionsCount > 0 ? combinedSuggestionsCount : (isSearchFocused && !query.trim() ? POPULAR_MUNICIPALITIES.length : 0);

    if (event.key === "ArrowDown" && totalCount > 0) {
      event.preventDefault();
      setHighlightedIndex(prev => (prev < totalCount - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp" && totalCount > 0) {
      event.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalCount - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0) {
        if (locationSuggestions.length > 0 && highlightedIndex < locationSuggestions.length) {
          selectLocation(locationSuggestions[highlightedIndex]);
        } else if (matchingPlaceSuggestions.length > 0 && highlightedIndex >= locationSuggestions.length) {
          const placeIdx = highlightedIndex - locationSuggestions.length;
          if (matchingPlaceSuggestions[placeIdx]) {
            selectPlace(matchingPlaceSuggestions[placeIdx]);
          }
        } else if (isSearchFocused && !query.trim() && POPULAR_MUNICIPALITIES[highlightedIndex]) {
          selectLocation(POPULAR_MUNICIPALITIES[highlightedIndex]);
        }
      } else {
        // Direct enter on query: zoom map to top matches
        setLocationSuggestions([]);
        setIsSearchFocused(false);
        setHighlightedIndex(-1);

        if (places.length === 1) {
          selectPlace(places[0]);
        } else if (places.length > 1) {
          setFocusBounds(places.map(p => [p.lat, p.lng]));
          setFocusLocation(null);
          setSelectedPlaceId(null);
        } else if (locationSuggestions.length > 0) {
          selectLocation(locationSuggestions[0]);
        }
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setLocationSuggestions([]);
      setIsSearchFocused(false);
      setHighlightedIndex(-1);
    }
  };

  const availableCategories = useMemo(() => {
    const categories = new Set([
      ...allPlaces.map(place => place.category),
      ...allProposals.map(proposal => proposal.category)
    ]);
    return Array.from(categories);
  }, [allPlaces, allProposals]);

  useEffect(() => {
    if (filter !== "ALL" && !availableCategories.includes(filter)) setFilter("ALL");
  }, [availableCategories, filter]);

  // Intelligent search scoring & ranking for places and proposals
  const places = useMemo(() => {
    return filterAndRankPlaces(allPlaces, query, filter);
  }, [allPlaces, filter, query]);

  const proposals = useMemo(() => {
    return filterAndRankProposals(allProposals, allPlaces, query, filter, statusFilter, sort);
  }, [allPlaces, allProposals, filter, query, sort, statusFilter]);

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
            <CityMap
              places={allPlaces}
              userLocation={userLocation}
              focusLocation={focusLocation}
              focusBounds={focusBounds}
              selectedPlaceId={selectedPlaceId}
              onPlaceSelect={place => selectPlace(place)}
            />
          </div>
          <div className={`space-y-3 ${view === "list" ? "lg:col-span-2" : ""}`}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div
                ref={searchContainerRef}
                className="relative flex flex-1 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7056d8]/60 focus-within:ring-4 focus-within:ring-[#7056d8]/10 dark:border-white/15 dark:bg-[#201b35] dark:shadow-black/20"
              >
                <Search size={17} className="shrink-0 text-slate-400 dark:text-slate-300"/>
                <input
                  role="combobox"
                  aria-expanded={combinedSuggestionsCount > 0 || (isSearchFocused && !query.trim())}
                  aria-haspopup="listbox"
                  aria-autocomplete="list"
                  aria-controls="location-suggestions-list"
                  aria-label={t("explore.searchPlaceholder")}
                  value={query}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={event => {
                    setQuery(event.target.value);
                    setLocationSearchError(false);
                    setGeoError(null);
                    if (nearMeActive) setNearMeActive(false);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t("explore.searchPlaceholder")}
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
                />

                <div className="flex items-center gap-1.5">
                  {isSearchingLocation && (
                    <Loader2 size={16} className="animate-spin text-sage" />
                  )}
                  {query && (
                    <button
                      type="button"
                      aria-label={t("explore.clear-search")}
                      onClick={() => {
                        setQuery("");
                        setNearMeActive(false);
                        setUserLocation(null);
                        setFocusLocation(null);
                        setFocusBounds(null);
                        setSelectedPlaceId(null);
                        setLocationSuggestions([]);
                        setHighlightedIndex(-1);
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X size={15}/>
                    </button>
                  )}
                </div>

                {/* Combined Suggestions Dropdown */}
                {combinedSuggestionsCount > 0 && (
                  <div
                    id="location-suggestions-list"
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#201b35]"
                  >
                    {/* Municipalities */}
                    {locationSuggestions.map((suggestion, index) => {
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <button
                          key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.displayName}`}
                          role="option"
                          aria-selected={isHighlighted}
                          type="button"
                          onClick={() => selectLocation(suggestion)}
                          className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                            isHighlighted
                              ? "bg-mint font-semibold text-sage dark:bg-white/15 dark:text-white"
                              : "text-ink hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Building2 size={15} className="shrink-0 text-sage" />
                            <span className="truncate">{suggestion.municipality || suggestion.displayName}</span>
                          </div>
                          <span className="shrink-0 rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            {t("explore.type-municipality")}
                          </span>
                        </button>
                      );
                    })}

                    {/* Specific Places */}
                    {matchingPlaceSuggestions.map((place, index) => {
                      const globalIdx = locationSuggestions.length + index;
                      const isHighlighted = globalIdx === highlightedIndex;
                      return (
                        <button
                          key={place.id}
                          role="option"
                          aria-selected={isHighlighted}
                          type="button"
                          onClick={() => selectPlace(place)}
                          className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                            isHighlighted
                              ? "bg-mint font-semibold text-sage dark:bg-white/15 dark:text-white"
                              : "text-ink hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin size={15} className="shrink-0 text-[#7056d8]" />
                            <span className="truncate">{place.name}</span>
                          </div>
                          <span className="shrink-0 rounded-md bg-[#7056d8]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#7056d8] dark:bg-[#7056d8]/25 dark:text-[#b9a9ff]">
                            {t("explore.type-place")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Popular suggestions when empty & focused */}
                {isSearchFocused && !query.trim() && combinedSuggestionsCount === 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#201b35]">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {t("explore.popular-searches")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_MUNICIPALITIES.map((pop, index) => {
                        const isHighlighted = index === highlightedIndex;
                        return (
                          <button
                            key={pop.displayName}
                            type="button"
                            onClick={() => selectLocation(pop)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                              isHighlighted
                                ? "border-sage bg-mint text-sage dark:bg-white/15 dark:text-white"
                                : "border-black/5 bg-slate-50 text-slate-700 hover:border-sage/40 hover:bg-mint/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            }`}
                          >
                            <Building2 size={12} className="text-sage" />
                            <span>{pop.municipality.replace(/\s+kommun$/i, "")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {locationSearchError && (
                  <p className="absolute left-0 top-full mt-2 text-xs text-slate-500">{t("explore.location-suggestions-are-unavailable-right-now")}</p>
                )}
              </div>

              {/* Enhanced Near Me Button with Active State */}
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locatingUser}
                title={nearMeActive ? t("explore.near-me-active") : t("explore.near-me")}
                aria-pressed={nearMeActive}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 disabled:cursor-wait disabled:opacity-60 active:scale-95 ${
                  nearMeActive
                    ? "border border-emerald-500/30 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border border-black/10 bg-white text-ink hover:border-[#7056d8]/60 hover:bg-[#7056d8]/5 hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-white dark:hover:border-white/30 dark:hover:bg-[#292044]"
                }`}
              >
                {locatingUser ? (
                  <Loader2 size={17} className="animate-spin text-[#7056d8]" />
                ) : nearMeActive ? (
                  <Check size={17} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                ) : (
                  <LocateFixed size={17} className="text-[#7056d8]" />
                )}
                <span>
                  {locatingUser
                    ? t("explore.locating")
                    : nearMeActive
                    ? t("explore.near-me-active")
                    : t("explore.near-me")}
                </span>
              </button>
            </div>

            {/* Active Near Me Status Banner */}
            {nearMeActive && query && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/70 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <LocateFixed size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("explore.showing-near-me")}: <strong>{query}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNearMeActive(false);
                    setUserLocation(null);
                    setQuery("");
                  }}
                  className="rounded-full p-1 text-emerald-700 hover:bg-emerald-200/50 dark:text-emerald-300 dark:hover:bg-emerald-800/40"
                  aria-label={t("explore.clear-search")}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {geoError && (
              <p role="status" className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                {geoError}
              </p>
            )}

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  filter === "ALL"
                    ? "bg-[#7056d8] text-white shadow-sm dark:bg-white dark:text-ink"
                    : "border border-black/10 bg-white text-slate-600 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                }`}
              >
                <span>{t("explore.all")}</span>
              </button>
              {availableCategories.map(catKey => {
                const isSelected = filter === catKey;
                const config = getCategoryConfig(catKey);
                const label = t(config.translationKey) || catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setFilter(catKey)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "text-white shadow-sm ring-2 ring-white/20"
                        : "border border-black/10 bg-white hover:border-black/20 dark:border-white/15 dark:bg-[#201b35]"
                    }`}
                    style={{
                      backgroundColor: isSelected ? config.color : undefined,
                      color: isSelected ? "#ffffff" : undefined,
                    }}
                  >
                    <span
                      className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5"
                      style={{ color: isSelected ? "#ffffff" : config.color }}
                      dangerouslySetInnerHTML={{ __html: config.iconSvg }}
                    />
                    <span className={isSelected ? "text-white" : "text-slate-700 dark:text-slate-200"}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t("explore.status-filter")}:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  statusFilter === "ALL"
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "border border-black/10 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-400 dark:hover:bg-white/5"
                }`}
              >
                {t("explore.all-statuses")}
              </button>
              {PROPOSAL_STATUS_STEPS.map((step) => {
                const isSelected = statusFilter === step.status;
                const badge = getStatusBadgeClasses(step.status);
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.status}
                    type="button"
                    onClick={() => setStatusFilter(isSelected ? "ALL" : step.status)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold leading-none transition ${
                      isSelected
                        ? `${badge.bg} ${badge.text} ${badge.border} ring-2 ring-purple-400/40 font-bold shadow-xs`
                        : "border-black/5 bg-white text-slate-600 hover:border-black/15 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-400 dark:hover:border-white/20"
                    }`}
                  >
                    <StepIcon size={12} className="shrink-0" />
                    <span className="inline-block leading-none">{t(step.translationKey)}</span>
                  </button>
                );
              })}
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
