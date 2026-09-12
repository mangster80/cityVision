"use client";
import Image from "next/image";
import Link from "next/link";
import { Coins, Flame, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
import { Proposal, Place } from "@/types";
import { useLanguage } from "@/components/language-provider";
import { getProposalInteraction, proposalChangeEventName } from "@/services/proposal-interactions";
import { hasProposalSupport } from "@/services/proposal-support-service";
import { getProposalVote } from "@/services/proposal-vote-service";
import { listProposalComments } from "@/services/proposal-comments-service";
import { getStoredUser } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { useEffect, useState } from "react";
import { formatCost } from "@/lib/format";
import { getStatusBadgeClasses, getStatusStep } from "@/lib/proposal-status-config";
import { getCategoryConfig } from "@/lib/category-config";
export function ProposalCard({ proposal, compact = false, imageMode = "before", priority = false }: { proposal: Proposal; compact?: boolean; imageMode?: "before-after" | "after" | "before"; priority?: boolean }) {
  const { t } = useLanguage();
  const [interaction, setInteraction] = useState({ votes: proposal.votes, supporters: proposal.supporters, comments: proposal.comments });
  const [personalInteraction, setPersonalInteraction] = useState({ supported: false, voted: false, commented: false });
  useEffect(() => {
    const syncInteraction = () => setInteraction(getProposalInteraction(proposal.id, { votes: proposal.votes, supporters: proposal.supporters, comments: proposal.comments }));
    syncInteraction();
    window.addEventListener(proposalChangeEventName(), syncInteraction);
    return () => window.removeEventListener(proposalChangeEventName(), syncInteraction);
  }, [proposal.id, proposal.comments, proposal.supporters, proposal.votes]);
  useEffect(() => {
    let cancelled = false;
    const loadPersonalInteraction = async () => {
      const storedUser = getStoredUser();
      if (!storedUser?.id) {
        if (!cancelled) setPersonalInteraction({ supported: false, voted: false, commented: false });
        return;
      }
      const [supported, vote] = await Promise.all([
        hasProposalSupport(proposal.id),
        getProposalVote(proposal.id)
      ]);
      if (cancelled) return;
      setPersonalInteraction({
        supported,
        voted: vote !== 0,
        commented: false
      });
    };
    void loadPersonalInteraction().catch(() => {
      if (!cancelled) setPersonalInteraction({ supported: false, voted: false, commented: false });
    });
    return () => {
      cancelled = true;
    };
  }, [proposal.id]);
  return <Link href={`/proposal/${proposal.id}`} className="group block overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#201b35]">
    <div className={`group/image relative isolate overflow-hidden ${compact ? "h-44" : "h-56"}`}>
      {imageMode === "after" ? (
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
          <Image sizes="(max-width: 768px) 100vw, 33vw" src={proposal.imageAfter} alt={t("proposal.vision")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">{t("proposal.vision")}</span>
        </div>
      ) : imageMode === "before" ? (
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
          <Image sizes="(max-width: 768px) 100vw, 33vw" src={proposal.imageBefore} alt={proposal.title} fill priority={priority} className="object-cover"/>
        </div>
      ) : (
        <div className="absolute inset-0 flex transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
         <div className="relative h-full w-1/2">
          <Image sizes="(max-width: 768px) 50vw, 25vw" src={proposal.imageBefore} alt={t("proposal.before")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">{t("proposal.current-state")}</span>
         </div>
         <div className="relative h-full w-1/2 border-l-2 border-white/80">
          <Image sizes="(max-width: 768px) 50vw, 25vw" src={proposal.imageAfter} alt={t("proposal.vision")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-sage/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">{t("proposal.desired-state")}</span>
         </div>
        </div>
      )}
      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
        {(() => {
          const config = getCategoryConfig(proposal.category);
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md"
              style={{ backgroundColor: config.color }}
            >
              <span
                className="inline-block h-3 w-3 [&>svg]:h-3 [&>svg]:w-3"
                dangerouslySetInnerHTML={{ __html: config.iconSvg }}
              />
              {t(config.translationKey) || proposal.category}
            </span>
          );
        })()}
        {proposal.status && proposal.status !== "idea" && (() => {
          const badge = getStatusBadgeClasses(proposal.status);
          const step = getStatusStep(proposal.status);
          const StatusIcon = step.icon;
          return (
            <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none backdrop-blur-md shadow-sm ${badge.bg} ${badge.text} ${badge.border}`}>
              <StatusIcon size={12} className="shrink-0" />
              <span className="inline-block leading-none">{t(step.translationKey)}</span>
            </span>
          );
        })()}
      </div>
    </div>
    <div className="p-5">
      <p className="mb-2 text-xs font-medium text-sage">{t("ui.improvement-proposal")}</p>
      <h3 className="mb-2 text-lg font-semibold leading-tight text-ink dark:text-white">{proposal.title}</h3>
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Image src={proposal.author.avatar} alt={proposal.author.name} width={22} height={22} className="h-5.5 w-5.5 rounded-full object-cover"/>
        <span className="font-medium text-ink dark:text-slate-200">{proposal.author.name}</span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>{t("ui.proposer")}</span>
      </div>
      {proposal.collaborators.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex -space-x-2">
            {proposal.collaborators.map(collaborator => (
              <Image key={collaborator.id} src={collaborator.avatar} alt="" width={22} height={22} className="rounded-full border-2 border-white dark:border-[#201b35]"/>
            ))}
          </div>
          <span>+{proposal.collaborators.length} {t("ui.collaborated-on-this-vision")}</span>
        </div>
      )}
      <p className="mb-2 flex items-center gap-1 text-xs text-slate-400">
        <MapPin size={12}/> {proposal.municipality}
      </p>
      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {proposal.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-black/5 pt-4 text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink dark:text-white">
          <span className={`flex items-center gap-1.5 ${personalInteraction.supported ? "text-orange-600 font-semibold dark:text-orange-400" : ""}`}>
            <Flame size={14} className={personalInteraction.supported ? "fill-orange-500 text-orange-500" : "text-orange-500/80 dark:text-orange-400/80"}/> {interaction.supporters}
          </span>
          <span className={`flex items-center gap-1.5 ${personalInteraction.voted ? "text-blue-600 font-semibold dark:text-blue-400" : ""}`}>
            <ThumbsUp size={14} className={personalInteraction.voted ? "fill-blue-500 text-blue-500" : "text-blue-500/80 dark:text-blue-400/80"}/> {interaction.votes}
          </span>
          <span className={`flex items-center gap-1.5 ${personalInteraction.commented ? "text-emerald-600 font-semibold dark:text-emerald-400" : ""}`}>
            <MessageCircle size={14} className={personalInteraction.commented ? "fill-emerald-500 text-emerald-500" : "text-emerald-500/80 dark:text-emerald-400/80"}/> {interaction.comments}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-ink dark:text-white">
          <Coins size={14} className="text-amber-500 dark:text-amber-400"/> {formatCost(proposal.cost)}
        </span>
      </div>
    </div>
  </Link>;
}
export function ProposalGrid({ proposals, compact = false, imageMode = "before", emptyMessage, priorityCount = 0 }: { proposals: Proposal[]; compact?: boolean; imageMode?: "before-after" | "after" | "before"; emptyMessage?: string; priorityCount?: number }) {
  const { t } = useLanguage();
  return proposals.length > 0
    ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{proposals.map((proposal, index) => <ProposalCard key={proposal.id} proposal={proposal} compact={compact} imageMode={imageMode} priority={index < priorityCount}/>)}</div>
    : <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-500 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-400">{emptyMessage || t("ui.no-proposals-yet")}</div>;
}
export function PlaceCard({ place }: { place: Place }) { const { t } = useLanguage(); return <Link href={`/place/${place.id}`} className="group flex gap-4 rounded-2xl border border-black/10 bg-white p-3.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#201b35] dark:hover:border-white/20"><div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl"><Image sizes="96px" src={place.image} alt="" fill className="object-cover transition group-hover:scale-105"/></div><div className="py-1"><p className="text-xs text-sage">{place.category}</p><h3 className="mt-1 font-semibold text-ink dark:text-white">{place.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin size={12}/> {place.city} · {place.proposalCount} {t("ui.proposals")}</p></div></Link>; }
export function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) { return <div className="flex items-center gap-3"><span className="text-sage">{icon}</span><div><p className="font-semibold text-ink dark:text-white">{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }

export function ProposalCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="skeleton-shimmer overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#201b35]">
      <div className={`relative bg-slate-200 dark:bg-slate-800 ${compact ? "h-44" : "h-56"}`}>
        <div className="absolute left-4 top-4 h-6 w-20 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>
      <div className="p-5">
        <div className="mb-2 h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mb-3 h-5 w-4/5 rounded-md bg-slate-300 dark:bg-slate-700" />
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5.5 w-5.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mb-2 h-3 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mb-4 space-y-1.5">
          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
          <div className="flex gap-4">
            <div className="h-4 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export function ProposalGridSkeleton({ count = 6, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProposalCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="skeleton-shimmer flex gap-4 rounded-2xl border border-black/[.06] bg-white p-3 dark:border-white/10 dark:bg-[#201b35]">
      <div className="h-20 w-24 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-32 rounded-md bg-slate-300 dark:bg-slate-700" />
        <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function PlaceGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PlaceCardSkeleton key={i} />
      ))}
    </div>
  );
}
