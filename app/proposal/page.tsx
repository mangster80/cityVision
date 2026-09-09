"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProposalGrid } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { useProposals } from "@/services/place-service";

export default function ProposalsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Alla");
  const [sort, setSort] = useState("Populärast");
  const normalizedQuery = query.trim().toLocaleLowerCase("sv-SE");
  const { proposals: allProposals, error, loading } = useProposals();
  const categories = useMemo(() => ["Alla", ...new Set(allProposals.map(proposal => proposal.category))], [allProposals]);
  const proposals = useMemo(() => {
    const matching = allProposals.filter(proposal => {
      const matchesQuery = !normalizedQuery || `${proposal.title} ${proposal.description} ${proposal.category} ${proposal.municipality}`.toLocaleLowerCase("sv-SE").includes(normalizedQuery);
      const matchesCategory = filter === "Alla" || proposal.category === filter;
      return matchesQuery && matchesCategory;
    });
    return [...matching].sort((a, b) => sort === "Nyast" ? b.createdAt.localeCompare(a.createdAt) : sort === "Mest stöd" ? b.supporters - a.supporters : b.votes - a.votes);
  }, [allProposals, filter, normalizedQuery, sort]);

  return <main className="px-5 pb-20 pt-32 sm:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("proposal.from-stadslyft")}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("proposal.all-improvement-proposals")}</h1>
          <p className="mt-3 max-w-xl text-slate-500">{t("proposal.explore-ideas-from-people-who-want-to-make-their-city-better")}</p>
        </div>
        <span className="text-sm text-slate-400">{proposals.length} {t("proposal.proposals")}</span>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/15 dark:bg-[#201b35]">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("proposal.search-proposals")} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          {query && <button type="button" aria-label={t("proposal.clear-search")} onClick={() => setQuery("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"><X size={15} /></button>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => <button key={category} onClick={() => setFilter(category)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === category ? "bg-ink text-white" : "border border-black/10 bg-white text-slate-500 dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"}`}>{category}</button>)}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <SlidersHorizontal size={15} />
            <select value={sort} onChange={event => setSort(event.target.value)} className="bg-transparent font-semibold text-ink outline-none dark:text-white">
              <option>Populärast</option>
              <option>Nyast</option>
              <option>Mest stöd</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Laddar förslag...</p>}
      {error && <p role="alert" className="text-sm text-red-600">Förslagen kunde inte hämtas: {error.message}</p>}
      <ProposalGrid proposals={proposals} compact emptyMessage={t("proposal.no-proposals-match-your-search")} />
    </div>
  </main>;
}
