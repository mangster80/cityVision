"use client";
import Image from "next/image";
import Link from "next/link";
import { Coins, Heart, MapPin, MessageCircle, ThumbsUp } from "lucide-react";
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
import { getStatusBadgeClasses } from "@/lib/proposal-status-config";
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
  return <Link href={`/proposal/${proposal.id}`} className="group block overflow-hidden rounded-3xl border border-black/[.07] bg-white shadow-[0_8px_30px_rgba(34,60,42,.05)] transition hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(34,60,42,.12)]">
    <div className={`group/image relative isolate overflow-hidden ${compact ? "h-44" : "h-56"}`}>
      {imageMode === "after" ? (
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
          <Image sizes="(max-width: 768px) 100vw, 33vw" src={proposal.imageAfter} alt={t("proposal.vision")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2 right-2 rounded-full bg-sage/90 px-2 py-1 text-[10px] font-semibold text-white">{t("proposal.vision")}</span>
        </div>
      ) : imageMode === "before" ? (
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
          <Image sizes="(max-width: 768px) 100vw, 33vw" src={proposal.imageBefore} alt={proposal.title} fill priority={priority} className="object-cover"/>
        </div>
      ) : (
        <div className="absolute inset-0 flex transform-gpu transition-transform duration-500 ease-out will-change-transform group-hover/image:scale-[1.03]">
         <div className="relative h-full w-1/2">
          <Image sizes="(max-width: 768px) 50vw, 25vw" src={proposal.imageBefore} alt={t("proposal.before")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">{t("proposal.current-state")}</span>
         </div>
         <div className="relative h-full w-1/2 border-l-2 border-white/80">
          <Image sizes="(max-width: 768px) 50vw, 25vw" src={proposal.imageAfter} alt={t("proposal.vision")} fill priority={priority} className="object-cover"/>
          <span className="absolute bottom-2 right-2 rounded-full bg-sage/90 px-2 py-1 text-[10px] font-semibold text-white">{t("proposal.desired-state")}</span>
         </div>
        </div>
      )}
      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-semibold text-ink shadow-sm dark:border-[#8f7be8]/40 dark:bg-[#201b35] dark:text-white">{proposal.category}</span>
        {proposal.status && proposal.status !== "idea" && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm ${getStatusBadgeClasses(proposal.status).bg} ${getStatusBadgeClasses(proposal.status).text} ${getStatusBadgeClasses(proposal.status).border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusBadgeClasses(proposal.status).dot}`} />
            {t(`proposal.status.${proposal.status}`)}
          </span>
        )}
      </div>
      {compact && <div className="absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/60 bg-ink/75 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-white shadow-lg backdrop-blur-md"><Image src={proposal.author.avatar} alt={proposal.author.name} width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover"/><span className="truncate">{proposal.author.name}</span></div>}
    </div>
    <div className="p-5"><p className="mb-2 text-xs font-medium text-sage">{t("ui.improvement-proposal")}</p><h3 className="mb-2 text-lg font-semibold leading-tight text-ink">{proposal.title}</h3>{!compact && <div className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Image src={proposal.author.avatar} alt={proposal.author.name} width={24} height={24} className="rounded-full"/><span>{proposal.author.name}</span><span className="text-slate-300">·</span><span>{t("ui.proposer")}</span></div>}{proposal.collaborators.length > 0 && <div className="mb-3 flex items-center gap-2 text-xs text-slate-500"><div className="flex -space-x-2">{proposal.collaborators.map(collaborator => <Image key={collaborator.id} src={collaborator.avatar} alt="" width={24} height={24} className="rounded-full border-2 border-white dark:border-[#201b35]"/>)}</div><span>+{proposal.collaborators.length} {t("ui.collaborated-on-this-vision")}</span></div>}<p className="mb-2 flex items-center gap-1 text-xs text-slate-400"><MapPin size={12}/> {proposal.municipality}</p><p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{proposal.description}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-black/5 pt-4 text-xs font-medium text-slate-500"><span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-ink"><span className={`flex items-center gap-1.5 ${personalInteraction.supported ? "text-sage" : ""}`}><Heart size={14} className={personalInteraction.supported ? "fill-sage text-sage" : "text-sage"}/> {interaction.supporters}</span><span className={`flex items-center gap-1.5 ${personalInteraction.voted ? "text-sage" : ""}`}><ThumbsUp size={14} className={personalInteraction.voted ? "fill-sage text-sage" : "text-sage"}/> {interaction.votes}</span><span className={`flex items-center gap-1.5 ${personalInteraction.commented ? "text-sage" : ""}`}><MessageCircle size={14} className={personalInteraction.commented ? "fill-sage text-sage" : "text-sage"}/> {interaction.comments}</span></span><span className="flex items-center gap-1.5"><Coins size={14} className="text-sage"/> {formatCost(proposal.cost)}</span></div></div>
  </Link>;
}
export function ProposalGrid({ proposals, compact = false, imageMode = "before", emptyMessage, priorityCount = 0 }: { proposals: Proposal[]; compact?: boolean; imageMode?: "before-after" | "after" | "before"; emptyMessage?: string; priorityCount?: number }) {
  const { t } = useLanguage();
  return proposals.length > 0
    ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{proposals.map((proposal, index) => <ProposalCard key={proposal.id} proposal={proposal} compact={compact} imageMode={imageMode} priority={index < priorityCount}/>)}</div>
    : <div className="rounded-3xl bg-white p-10 text-center text-slate-500 dark:bg-[#201b35]">{emptyMessage || t("ui.no-proposals-yet")}</div>;
}
export function PlaceCard({ place }: { place: Place }) { const { t } = useLanguage(); return <Link href={`/place/${place.id}`} className="group flex gap-4 rounded-2xl border border-black/[.06] bg-white p-3 transition hover:shadow-lg"><div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl"><Image sizes="96px" src={place.image} alt="" fill className="object-cover transition group-hover:scale-105"/></div><div className="py-1"><p className="text-xs text-sage">{place.category}</p><h3 className="mt-1 font-semibold text-ink">{place.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin size={12}/> {place.city} · {place.proposalCount} {t("ui.proposals")}</p></div></Link>; }
export function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) { return <div className="flex items-center gap-3"><span className="text-sage">{icon}</span><div><p className="font-semibold text-ink">{value}</p><p className="text-xs text-slate-400">{label}</p></div></div>; }

export function ProposalCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="skeleton-shimmer overflow-hidden rounded-3xl border border-black/[.07] bg-white shadow-[0_8px_30px_rgba(34,60,42,.05)] dark:border-white/10 dark:bg-[#201b35]">
      <div className={`relative bg-slate-200 dark:bg-slate-800 ${compact ? "h-44" : "h-56"}`}>
        <div className="absolute left-4 top-4 h-6 w-20 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>
      <div className="p-5">
        <div className="mb-2 h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mb-3 h-5 w-4/5 rounded-md bg-slate-300 dark:bg-slate-700" />
        {!compact && (
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        )}
        <div className="mb-2 h-3 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mb-4 space-y-1.5">
          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
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
