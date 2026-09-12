"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { ProposalGrid, ProposalGridSkeleton } from "@/components/ui";
import { usePlaceDetail } from "@/services/place-service";
import { useLanguage } from "@/components/language-provider";

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { place, proposals, error, loading } = usePlaceDetail(id);
  const { t } = useLanguage();

  if (loading) {
    return (
      <main className="px-5 pb-20 pt-32 sm:px-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div className="h-[380px] rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col justify-center space-y-4">
              <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-20">
            <div className="mb-4 h-6 w-48 rounded bg-slate-300 dark:bg-slate-700" />
            <ProposalGridSkeleton count={3} compact />
          </div>
        </div>
      </main>
    );
  }
  if (error) return <main className="grid min-h-screen place-items-center px-5 pt-20"><p role="alert" className="text-sm text-red-600">{t("place.load-error")}: {error.message}</p></main>;
  if (!place) return <main className="pt-40 text-center">{t("place.not-found")}</main>;

  const contributors = [...new Map(proposals.map(proposal => [proposal.author.id, proposal.author])).values()];
  return <main className="px-5 pb-20 pt-32 sm:px-10"><div className="mx-auto max-w-7xl"><Link href="/explore" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> {t("place.back-to-explore")}</Link><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div className="relative h-[380px] overflow-hidden rounded-[2rem]"><Image sizes="(max-width: 1024px) 100vw, 50vw" src={place.image} alt={place.name} fill priority className="object-cover"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-7 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur">{place.category}</span><h1 className="mt-3 text-4xl font-semibold">{place.name}</h1></div></div><div className="flex flex-col justify-center"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("place.about")}</p><h2 className="text-3xl font-semibold tracking-tight">{t("place.headline")}</h2><p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500">{place.description}</p><div className="mt-7 flex items-center gap-2 text-sm text-slate-500"><MapPin size={17} className="text-sage"/> {place.city} · {place.lat.toFixed(3)}, {place.lng.toFixed(3)}</div>{contributors.length > 0 && <div className="mt-7 w-fit rounded-2xl border border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#201b35]">  <p className="mb-2 text-xs text-slate-400">{contributors.length === 1 ? t("place.created-by") : t("place.people-created").replace("{count}", String(contributors.length))}</p><div className="flex flex-wrap items-center gap-2">{contributors.map(contributor =>   <Link key={contributor.id} href={`/profile?user=${contributor.id}`} title={`${t("place.view-profile")} ${contributor.name}`} className="flex items-center gap-2 rounded-full pr-2 text-sm font-semibold transition hover:bg-mint dark:hover:bg-[#292044]"><Image src={contributor.avatar} alt={`${t("place.profile-image")} ${contributor.name}`} width={28} height={28} className="rounded-full"/><span>{contributor.name}</span></Link>)}</div></div>}<div className="mt-8"><Link href="/create" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7056d8]"><Plus size={16}/> {t("place.add-proposal")}</Link></div></div></div><div className="mt-20"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-sage">{t("place.community-proposals")}</p><h2 className="text-3xl font-semibold">{proposals.length} {t("place.ideas-for-place")}</h2></div><div className="mt-8"><ProposalGrid proposals={proposals} compact imageMode="after"/></div></div></div></main>;
}
