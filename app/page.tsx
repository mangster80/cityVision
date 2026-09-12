"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Flame, MapPin, Sparkles } from "lucide-react";
import { ProposalGrid, ProposalGridSkeleton } from "@/components/ui";
import { usePlaces, useProposals, useWeeklyPlaceVotes } from "@/services/place-service";
import { useLanguage } from "@/components/language-provider";
import { places as fallbackPlaces, proposals as fallbackProposals } from "@/data/mock-data";
import { useEffect, useState } from "react";

function AnimatedStat({ value, compact = false }: { value: number; compact?: boolean }) {
  const { language } = useLanguage();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1000;
    let animationFrame = 0;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(value * easedProgress));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  const locale = language === "en" ? "en-US" : "sv-SE";
  const formattedValue = compact && displayValue >= 1000
    ? `${Math.floor(displayValue / 1000)}K`
    : displayValue.toLocaleString(locale);

  return <>{formattedValue}</>;
}

export default function Home() {
  const { t } = useLanguage();
  const { proposals: allProposals, loading: proposalsLoading } = useProposals();
  const { places, loading: placesLoading } = usePlaces();
  const loading = proposalsLoading || placesLoading;
  const proposals = allProposals.slice(0, 3);
  const totalHypes = allProposals.reduce((total, proposal) => total + proposal.supporters, 0);
  const fallbackTotalHypes = fallbackProposals.reduce((total, proposal) => total + proposal.supporters, 0);
  const placesCount = places.length > 0 ? places.length : fallbackPlaces.length;
  const proposalsCount = allProposals.length > 0 ? allProposals.length : fallbackProposals.length;
  const hypesCount = allProposals.length > 0 ? totalHypes : fallbackTotalHypes;
  const placeHypeTotals = allProposals.reduce<Record<string, number>>((totals, proposal) => ({
    ...totals,
    [proposal.placeId]: (totals[proposal.placeId] ?? 0) + proposal.supporters
  }), {});
  const weeklyHypes = placeHypeTotals;
  const weeklyPlace = places.reduce((mostHyped, place) =>
    (weeklyHypes[place.id] ?? 0) > (weeklyHypes[mostHyped?.id ?? ""] ?? 0) ? place : mostHyped,
    places[0]
  );
  const weeklyPlaceHypeCount = weeklyPlace ? weeklyHypes[weeklyPlace.id] ?? 0 : 0;

  return (
    <main>
      <section className="hero-grid relative overflow-hidden px-5 pb-20 pt-36 sm:px-10 sm:pt-44">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-white/70 px-4 py-2 text-xs font-semibold text-sage dark:border-white/15 dark:bg-[#292044]/80 dark:text-[#b9a9ff]">
              <Sparkles size={14}/> {t("home.eyebrow")}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-.05em] text-ink sm:text-7xl">
              {t("home.title-part1")}<br/>  <span className="gradient-text">{t("home.title-part2")}</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-500">
              {t("home.lead")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/explore" className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sage">
                {t("home.explore-places")} <ArrowRight size={17}/>
              </Link>
              <Link href="/create" className="flex items-center gap-2 rounded-full border border-sage/30 bg-mint px-6 py-3.5 text-sm font-semibold text-sage transition hover:border-sage hover:bg-sage/10 dark:border-[#b9a9ff]/35 dark:bg-[#292044] dark:text-[#b9a9ff] dark:hover:bg-[#b9a9ff]/10">
                {t("home.share-idea")} <ArrowRight size={17}/>
              </Link>
            </div>
            <div className="mt-14 flex gap-8 border-t border-ink/10 pt-6">
              <div>
                <p className="text-2xl font-semibold">
                  <AnimatedStat value={placesCount}/>
                </p>
                <p className="text-xs text-slate-400">{t("home.places-in-focus")}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  <AnimatedStat value={proposalsCount}/>
                </p>
                <p className="text-xs text-slate-400">{t("home.shared-visions")}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  <AnimatedStat value={hypesCount} compact/>
                </p>
                <p className="text-xs text-slate-400">{t("home.city-votes")}</p>
              </div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[680px] lg:max-w-[680px]">
            {loading ? (
              <div className="skeleton-shimmer relative block h-[min(78vh,620px)] min-h-[500px] overflow-hidden rounded-[2.5rem] border border-black/5 bg-slate-200 shadow-xl dark:border-white/10 dark:bg-slate-800">
                <div className="absolute left-4 top-4 h-16 w-36 rounded-2xl bg-slate-300/60 backdrop-blur dark:bg-slate-700/60" />
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="h-3 w-28 rounded-full bg-slate-300/80 dark:bg-slate-700" />
                  <div className="h-7 w-2/3 rounded-lg bg-slate-300 dark:bg-slate-700" />
                  <div className="h-4 w-32 rounded-full bg-slate-300/80 dark:bg-slate-700" />
                </div>
              </div>
            ) : weeklyPlace ? (
              <Link
                href={`/place/${weeklyPlace.id}`}
                aria-label={t("home.view-place").replace("{name}", weeklyPlace.name)}
                className="float relative block h-[min(78vh,620px)] min-h-[500px] overflow-hidden rounded-[2.5rem] shadow-2xl transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,19,38,.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage"
              >
                <Image
                  sizes="(max-width: 1024px) 100vw, 680px"
                  src={weeklyPlace.image || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85"}
                  alt={weeklyPlace.name}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent"/>
                <div className="glass absolute left-4 top-4 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-500">
                      <Flame size={20} className="fill-orange-500"/>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-white">
                        <AnimatedStat value={weeklyPlaceHypeCount} compact/> {t("home.hypes")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t("home.on-popular-place")}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/70">{t("home.place-of-the-week")}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{weeklyPlace.name}</h2>
                  <p className="mt-2 flex items-center gap-1 text-sm text-white/75"><MapPin size={14}/> {weeklyPlace.city}</p>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("home.from-community")}</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.moving-ideas")}</h2>
            </div>
            <Link href="/explore" className="hidden items-center gap-2 text-sm font-semibold text-sage sm:flex">
              {t("home.see-all-proposals")} <ArrowUpRight size={16}/>
            </Link>
          </div>
          {proposalsLoading ? (
            <ProposalGridSkeleton count={3} compact />
          ) : (
            <ProposalGrid proposals={proposals} compact/>
          )}
        </div>
      </section>

      <section id="om" className="bg-ink px-5 py-24 text-white sm:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("home.together-stronger")}</p>
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">{t("home.city-belongs-to-all")}</h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-white/55">
            {t("home.together-lead")}
          </p>
        </div>
      </section>
    </main>
  );
}
