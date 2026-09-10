"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { List, Map, Search, SlidersHorizontal, X } from "lucide-react";
import { usePlaces, useProposals } from "@/services/place-service";
import { PlaceCard, ProposalGrid } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { LocationSuggestion, searchMunicipalities } from "@/services/geocoding-service";
const CityMap = dynamic(() => import("@/components/city-map").then(module => module.CityMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Laddar karta...</div>
});
export default function Explore() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("Alla");
  const [sort, setSort] = useState("Populärast");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearchError, setLocationSearchError] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("sv-SE");
  const normalizedSearchTerm = normalizedQuery.replace(/\s+(kommun|stad)$/u, "").trim();
  const { places: allPlaces, error: placesError, loading: placesLoading } = usePlaces();
  const { proposals: allProposals, error: proposalsError, loading: proposalsLoading } = useProposals();
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
    return ["Alla", ...categories];
  }, [matchingPlaces, matchingProposals]);
  useEffect(() => {
    if (!availableCategories.includes(filter)) setFilter("Alla");
  }, [availableCategories, filter]);
  const places = useMemo(() => matchingPlaces.filter(place => {
    const matchesCategory = filter === "Alla" || place.category === filter;
    return matchesCategory;
  }), [filter, matchingPlaces]);
  const proposals = useMemo(() => {
    const list = matchingProposals.filter(proposal => {
      const matchesCategory = filter === "Alla" || proposal.category === filter;
      return matchesCategory;
    });
    return [...list].sort((a, b) => sort === "Nyast" ? b.createdAt.localeCompare(a.createdAt) : sort === "Mest stöd" ? b.supporters - a.supporters : b.votes - a.votes);
  }, [filter, matchingProposals, sort]);
   return <main className="min-h-screen px-5 pb-20 pt-32 sm:px-10"><div className="mx-auto max-w-7xl"><div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("explore.discover-your-city")}</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("explore.header")}</h1><p className="mt-3 text-slate-500">{t("explore.description")}</p></div><div className="flex gap-2"><button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${view === "map" ? "bg-[#7056d8] text-white dark:bg-white dark:text-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}><Map size={16} className="mr-2 inline"/> {t("explore.map")}</button><button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${view === "list" ? "bg-[#7056d8] text-white dark:bg-white dark:text-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}><List size={16} className="mr-2 inline"/> {t("explore.list")}</button></div></div><div className="mb-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]"><div className={`relative h-[340px] overflow-hidden rounded-3xl border border-black/10 shadow-inner dark:border-white/10 ${view === "list" ? "hidden" : ""}`}><CityMap places={allPlaces} onPlaceSelect={place => setQuery(place.name)} /></div><div className={`space-y-3 ${view === "list" ? "lg:col-span-2" : ""}`}>   <div className="relative flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm transition focus-within:border-[#7056d8]/60 focus-within:ring-4 focus-within:ring-[#7056d8]/10 dark:border-white/15 dark:bg-[#201b35] dark:shadow-black/20"><Search size={17} className="shrink-0 text-slate-400 dark:text-slate-300"/>    <input value={query} onChange={event => { setQuery(event.target.value); setLocationSearchError(false); }} placeholder={t("explore.searchPlaceholder")} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"/>{locationSuggestions.length > 0 && <div className="absolute left-10 right-12 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#201b35]">  {locationSuggestions.map(suggestion => <button key={`${suggestion.latitude}-${suggestion.longitude}`} type="button" onClick={() => selectLocation(suggestion)} className="block w-full px-4 py-3 text-left text-sm hover:bg-mint dark:hover:bg-white/10">{suggestion.municipality || suggestion.displayName}</button>)}</div>}{locationSearchError && <p className="absolute left-0 top-full mt-2 text-xs text-slate-500">{t("explore.location-suggestions-are-unavailable-right-now")}</p>}{query && <button type="button" aria-label={t("explore.clear-search")} onClick={() => setQuery("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"><X size={15}/></button>}</div>  <div className="flex flex-wrap gap-2">{availableCategories.map(c => <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === c ? "bg-[#7056d8] text-white dark:bg-ink" : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}>{c}</button>)}</div><div className="flex items-center justify-between pt-2"><span className="text-sm text-slate-400">{proposalsLoading ? t("explore.loadingProposals") : `${proposals.length} ${t("explore.proposalsFound")}`}</span><label className="flex items-center gap-2 text-sm text-slate-5 񟿿00"><SlidersHorizontal size={15}/><select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent font-semibold text-ink outline-none dark:text-white"><option>{t("explore.mostPopular")}</option><option>{t("explore.newest")}</option><option>{t("explore.mostSupport")}</option></select></label></div></div></div>{proposalsError && <p role="alert" className="text-sm text-red-600">{t("explore.proposalsError")}: {proposalsError.message}</p>}{proposalsLoading ? <div className="grid min-h-[420px] place-items-center rounded-3xl bg-white/50 text-sm text-slate-500 dark:bg-[#201b35]/50">{t("explore.loadingProposals")}</div> : <ProposalGrid proposals={proposals} compact imageMode="before" emptyMessage={t("explore.noMatchingProposals")}/>}<h2 className="mb-5 mt-20 text-2xl font-semibold">{t("explore.placesHeader")}</h2>{placesError && <p role="alert" className="text-sm text-red-600">{t("explore.placesError")}: {placesError.message}</p>}{placesLoading ? <div className="grid min-h-[220px] place-items-center rounded-3xl bg-white/50 text-sm text-slate-500 dark:bg-[#201b35]/50">{t("explore.loadingPlaces")}</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{places.map(p => <PlaceCard key={p.id} place={p}/>)}{places.length === 0 && <p className="text-sm text-slate-500">{t("explore.emptyPlaces")}</p>}</div>}</div></main>;
}
