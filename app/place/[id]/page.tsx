"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { ProposalGrid, ProposalGridSkeleton } from "@/components/ui";
import { usePlaceDetail } from "@/services/place-service";
import { useLanguage } from "@/components/language-provider";
import { ShareButton } from "@/components/share-button";
import { PROPOSAL_STATUS_STEPS, getStatusBadgeClasses } from "@/lib/proposal-status-config";

type SortOption = "popular" | "newest" | "support";

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { place, proposals, error, loading } = usePlaceDetail(id);
  const { t } = useLanguage();
  const [sort, setSort] = useState<SortOption>("popular");
  const [filter, setFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const availableCategories = useMemo(() => {
    return [...new Set(proposals.map(p => p.category))].filter(Boolean);
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const list = proposals.filter(p => {
      const matchesCategory = filter === "ALL" || p.category === filter;
      const proposalStatus = p.status ?? "idea";
      const matchesStatus = statusFilter === "ALL" || proposalStatus === statusFilter;
      const normalizedSearch = searchQuery.trim().toLowerCase();
      const matchesSearch = !normalizedSearch ||
        p.title.toLowerCase().includes(normalizedSearch) ||
        p.description.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesStatus && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "support") return b.supporters - a.supporters;
      return b.votes - a.votes;
    });
  }, [filter, proposals, searchQuery, sort, statusFilter]);

  if (loading) {
    return (
      <main className="px-5 pb-20 pt-32 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="skeleton-shimmer mb-8 h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div className="skeleton-shimmer h-[380px] rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col justify-center space-y-4">
              <div className="skeleton-shimmer h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="skeleton-shimmer h-8 w-3/4 rounded-lg bg-slate-300 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="skeleton-shimmer h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="skeleton-shimmer h-4 w-5/6 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="skeleton-shimmer h-4 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="skeleton-shimmer h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-20">
            <div className="skeleton-shimmer mb-4 h-6 w-48 rounded-lg bg-slate-300 dark:bg-slate-700" />
            <ProposalGridSkeleton count={3} compact />
          </div>
        </div>
      </main>
    );
  }
  if (error) return <main className="grid min-h-screen place-items-center px-5 pt-20"><p role="alert" className="text-sm text-red-600">{t("place.load-error")}: {error.message}</p></main>;
  if (!place) return <main className="pt-40 text-center">{t("place.not-found")}</main>;

  const contributors = [...new Map(proposals.map(proposal => [proposal.author.id, proposal.author])).values()];
  return (
    <main className="px-5 pb-20 pt-32 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-slate-500"
          >
            <ArrowLeft size={16} /> {t("place.back-to-explore")}
          </Link>
          <ShareButton title={place.name} text={`${place.name} · ${place.city} – Stadslyft`} />
        </div>
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative h-[380px] overflow-hidden rounded-[2rem]">
            <Image
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={place.image}
              alt={place.name}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-7 text-white">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">
                {place.category}
              </span>
              <h1 className="mt-3 text-4xl font-semibold">{place.name}</h1>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">
              {t("place.about")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("place.headline")}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500">
              {place.description}
            </p>
            <div className="mt-7 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={17} className="text-sage" /> {place.city} ·{" "}
              {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
            </div>
            {contributors.length > 0 && (
              <div className="mt-7 w-fit rounded-2xl border border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#201b35]">
                <p className="mb-2 text-xs text-slate-400">
                  {contributors.length === 1
                    ? t("place.created-by")
                    : t("place.people-created").replace(
                        "{count}",
                        String(contributors.length),
                      )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {contributors.map((contributor) => (
                    <Link
                      key={contributor.id}
                      href={`/profile?user=${contributor.id}`}
                      title={`${t("place.view-profile")} ${contributor.name}`}
                      className="flex items-center gap-2 rounded-full pr-2 text-sm font-semibold transition hover:bg-mint dark:hover:bg-[#292044]"
                    >
                      <Image
                        src={contributor.avatar}
                        alt={`${t("place.profile-image")} ${contributor.name}`}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                      <span>{contributor.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7056d8]"
              >
                <Plus size={16} /> {t("place.add-proposal")}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-sage">
                {t("place.community-proposals")}
              </p>
              <h2 className="text-3xl font-semibold">
                {proposals.length} {t("place.ideas-for-place")}
              </h2>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <SlidersHorizontal size={15} />
              <select
                aria-label={t("explore.mostPopular")}
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

          {/* Filters & Search */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {availableCategories.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      filter === "ALL"
                        ? "bg-[#7056d8] text-white dark:bg-ink"
                        : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"
                    }`}
                  >
                    {t("explore.all")}
                  </button>
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilter(cat)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        filter === cat
                          ? "bg-[#7056d8] text-white dark:bg-ink"
                          : "border border-black/10 bg-white text-slate-500 hover:border-[#7056d8] hover:text-[#7056d8] dark:border-white/15 dark:bg-[#201b35] dark:text-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : <div />}

              {proposals.length > 2 && (
                <div className="relative flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm transition focus-within:border-[#7056d8]/60 focus-within:ring-2 focus-within:ring-[#7056d8]/10 sm:max-w-xs dark:border-white/15 dark:bg-[#201b35]">
                  <Search size={15} className="shrink-0 text-slate-400 dark:text-slate-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t("place.search-placeholder")}
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t("explore.clear-search")}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status pills */}
            {proposals.length > 1 && (
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
            )}
          </div>

          <div className="mt-6">
            <ProposalGrid
              proposals={filteredProposals}
              compact
              imageMode="after"
              emptyMessage={t("place.no-matching-proposals")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
