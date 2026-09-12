"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProposalGrid } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";
import { useProposals } from "@/services/place-service";
import { PROPOSAL_STATUS_STEPS, getStatusBadgeClasses } from "@/lib/proposal-status-config";
import { ShareButton } from "@/components/share-button";
import { CATEGORY_CONFIGS, getCategoryConfig } from "@/lib/category-config";

type SortOption = "popular" | "newest" | "support";

export default function ProposalsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState<SortOption>("popular");
  const normalizedQuery = query.trim().toLocaleLowerCase("sv-SE");
  const { proposals: allProposals, error, loading } = useProposals();
  const categories = useMemo(() => ["ALL", ...new Set(allProposals.map(proposal => proposal.category))], [allProposals]);
  const proposals = useMemo(() => {
    const matching = allProposals.filter(proposal => {
      const matchesQuery = !normalizedQuery || `${proposal.title} ${proposal.description} ${proposal.category} ${proposal.municipality}`.toLocaleLowerCase("sv-SE").includes(normalizedQuery);
      const matchesCategory = filter === "ALL" || proposal.category === filter;
      const proposalStatus = proposal.status ?? "idea";
      const matchesStatus = statusFilter === "ALL" || proposalStatus === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
    return [...matching].sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "support") return b.supporters - a.supporters;
      return b.votes - a.votes;
    });
  }, [allProposals, filter, normalizedQuery, sort, statusFilter]);

  return <main className="px-5 pb-20 pt-32 sm:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("proposal.from-stadslyft")}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("proposal.all-improvement-proposals")}</h1>
          <p className="mt-3 max-w-xl text-slate-500">{t("proposal.explore-ideas-from-people-who-want-to-make-their-city-better")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{proposals.length} {t("proposal.proposals")}</span>
          <ShareButton
            variant="button"
            title={t("proposal.all-improvement-proposals")}
            text={`${t("proposal.all-improvement-proposals")} – Stadslyft`}
          />
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/15 dark:bg-[#201b35]">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("proposal.search-proposals")} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          {query && <button type="button" aria-label={t("proposal.clear-search")} onClick={() => setQuery("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"><X size={15} /></button>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const isSelected = filter === category;
              if (category === "ALL") {
                return (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#7056d8] text-white shadow-sm dark:bg-white dark:text-ink"
                        : "border border-black/10 bg-white text-slate-600 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                    }`}
                  >
                    <span>{t("explore.all")}</span>
                  </button>
                );
              }
              const config = getCategoryConfig(category);
              const label = t(config.translationKey) || category;

              return (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
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
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <SlidersHorizontal size={15} />
            <select value={sort} onChange={event => setSort(event.target.value as SortOption)} className="bg-transparent font-semibold text-ink outline-none dark:text-white">
              <option value="popular">{t("proposal.most-popular")}</option>
              <option value="newest">{t("proposal.newest")}</option>
              <option value="support">{t("proposal.most-support")}</option>
            </select>
          </label>
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
            return (
              <button
                key={step.status}
                type="button"
                onClick={() => setStatusFilter(isSelected ? "ALL" : step.status)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isSelected
                    ? `${badge.bg} ${badge.text} ${badge.border} ring-2 ring-purple-400/40 font-bold shadow-xs`
                    : "border-black/5 bg-white text-slate-600 hover:border-black/15 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-400 dark:hover:border-white/20"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {t(step.translationKey)}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">{t("proposal.loading")}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{t("proposal.load-error")}: {error.message}</p>}
      <ProposalGrid proposals={proposals} compact imageMode="before-after" emptyMessage={t("proposal.no-proposals-match-your-search")} />
    </div>
  </main>;
}
