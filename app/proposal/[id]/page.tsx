"use client";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { useProposalDetail } from "@/services/place-service";
import { ProposalActions, ProposalComments } from "@/components/proposal-actions";
import { ProposalStats } from "@/components/proposal-stats";
import { ProposalGallery } from "@/components/proposal-gallery";
import { supabase } from "@/services/supabase";
export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { proposal, place, error, loading } = useProposalDetail(id);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }
    const client = supabase;
    const syncSession = async () => {
      const { data, error: authError } = await client.auth.getUser();
      if (authError) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(Boolean(data.user));
    };
    void syncSession();
    const { data: authListener } = client.auth.onAuthStateChange(() => { void syncSession(); });
    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="pt-40 text-center">Laddar förslag...</main>;
  if (error) return <main className="pt-40 text-center" role="alert">Förslaget kunde inte hämtas: {error.message}</main>;
  if (!proposal) return <main className="pt-40 text-center">Förslaget hittades inte.</main>;
  const author = proposal.author;
  const collaborators = proposal.collaborators ?? [];
  return <main className="px-5 pb-20 pt-32 sm:px-10"><div className="mx-auto max-w-6xl"><Link href={`/place/${proposal.placeId}`} className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> Tillbaka till {place?.name}</Link><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><div className="grid grid-cols-2 gap-3"><div><ProposalGallery images={proposal.imagesBefore ?? [proposal.imageBefore]} label="Före" /></div><div><ProposalGallery images={proposal.imagesAfter ?? [proposal.imageAfter]} label="Vision" accent /></div></div><div className="mt-5 flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4"><Link href={`/profile?user=${author.id}`} aria-label={`Visa profilen för ${author.name}`} className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-75"><Image src={author.avatar} alt={`Profilbild för ${author.name}`} width={52} height={52} className="rounded-full"/><div>  <span className="inline-flex items-center rounded-full border border-sage/30 bg-mint px-3 py-1 text-[10px] font-bold tracking-[.14em] text-sage dark:bg-[#292044]">STADSLYFT-MEDLEM</span><p className="mt-1 text-sm font-semibold">{author.name}</p><p className="text-xs text-slate-400">Stockholm · med sedan september 2024</p></div></Link><Link href={`/profile?user=${author.id}`} aria-label={`Visa profilen för ${author.name}`} className="text-slate-400 transition hover:text-ink">  <Share2 size={18}/></Link></div>{collaborators.length > 0 && <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#201b35]"><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-sage">SAMARBETE I VISIONEN</p><div className="flex flex-wrap gap-2">{collaborators.map(collaborator => <Link key={collaborator.id} href={`/profile?user=${collaborator.id}`} className="flex items-center gap-2 rounded-full border border-black/5 px-2 py-1.5 text-xs font-semibold transition hover:bg-mint dark:border-white/10 dark:hover:bg-[#292044]"><Image src={collaborator.avatar} alt={`Profilbild för ${collaborator.name}`} width={24} height={24} className="rounded-full"/>{collaborator.name}</Link>)}</div></div>}</div><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{proposal.category} · {proposal.municipality}</p><h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{proposal.title}</h1><p className="mt-6 text-lg leading-relaxed text-slate-500">{proposal.description}</p><ProposalStats proposal={proposal}/>{isAuthenticated && <ProposalActions proposal={proposal}/>}</div></div><ProposalComments proposal={proposal} initialComments={[]} canComment={isAuthenticated === true}/></div></main>;
}
