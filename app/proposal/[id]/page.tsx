"use client";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProposalDetail } from "@/services/place-service";
import { ProposalActions, ProposalComments } from "@/components/proposal-actions";
import { ProposalStats } from "@/components/proposal-stats";
import { ProposalGallery } from "@/components/proposal-gallery";
import { supabase } from "@/services/supabase";
import { isDemoLoginEnabled } from "@/services/user-storage";
import { getStoredUser } from "@/services/user-storage";
import { CollaboratorInviteForm } from "@/components/collaborator-invite-form";
import { useToast } from "@/components/toast-provider";
import { deleteSupabaseProposal } from "@/services/proposal-service";
import { useLanguage } from "@/components/language-provider";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
export default function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { proposal, place, error, loading } = useProposalDetail(id);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const syncSession = async () => {
      if (isDemoLoginEnabled()) {
        setIsAuthenticated(true);
        setAuthUserId(null);
        return;
      }
      if (!supabase) {
        setIsAuthenticated(false);
        setAuthUserId(null);
        return;
      }
      const client = supabase;
      const { data, error: authError } = await client.auth.getUser();
      if (authError) {
        setIsAuthenticated(false);
        setAuthUserId(null);
        return;
      }
      setIsAuthenticated(Boolean(data.user));
      setAuthUserId(data.user?.id ?? null);
    };
    void syncSession();
    window.addEventListener("cityvision-auth-change", syncSession);
    const authListener = supabase?.auth.onAuthStateChange(() => { void syncSession(); });
    return () => {
      window.removeEventListener("cityvision-auth-change", syncSession);
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <main className="pt-40 text-center">{t("proposal.loading")}</main>;
  if (error) return <main className="pt-40 text-center" role="alert">{t("proposal.load-error")}: {error.message}</main>;
  if (!proposal) return <main className="pt-40 text-center">{t("proposal.not-found")}</main>;
  const author = proposal.author;
  const collaborators = proposal.collaborators ?? [];
  const currentUser = getStoredUser();
  const demoMode = isDemoLoginEnabled();
  const canInvite = demoMode || currentUser?.id === "u1" || Boolean(currentUser?.id && currentUser.id === author.id);
  const canDelete = Boolean(authUserId && authUserId === author.id);
  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSupabaseProposal(proposal.id);
      showToast(t("proposal.deleted"));
      router.push(`/place/${proposal.placeId}`);
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : t("proposal.delete-error"));
      setIsDeleting(false);
    }
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: proposal.title,
    description: proposal.description,
    image: proposal.imagesAfter?.[0] ?? proposal.imageAfter,
    author: { "@type": "Person", name: author.name },
    contentLocation: { "@type": "Place", name: place?.name ?? proposal.municipality },
    datePublished: proposal.createdAt,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://stadslyft.se"}/proposal/${proposal.id}`
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><main className="px-5 pb-20 pt-32 sm:px-10"><div className="mx-auto max-w-6xl"><Link href={`/place/${proposal.placeId}`} className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> Tillbaka till {place?.name}</Link><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><div className="grid grid-cols-2 gap-3"><div><ProposalGallery images={proposal.imagesBefore ?? [proposal.imageBefore]} label="Före" /></div><div><ProposalGallery images={proposal.imagesAfter ?? [proposal.imageAfter]} label="Vision" accent /></div></div><div className="mt-5 flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4"><Link href={`/profile?user=${author.id}`} aria-label={`Visa profilen för ${author.name}`} className="flex items-center gap-3 rounded-xl text-left transition hover:opacity-75"><Image src={author.avatar} alt={`Profilbild för ${author.name}`} width={52} height={52} className="rounded-full"/><div><span className="inline-flex items-center rounded-full border border-sage/30 bg-mint px-3 py-1 text-[10px] font-bold tracking-[.14em] text-sage dark:bg-[#292044]">STADSLYFT-MEDLEM</span><p className="mt-1 text-sm font-semibold">{author.name}</p><p className="text-xs text-slate-400">Stockholm · med sedan september 2024</p></div></Link><Link href={`/profile?user=${author.id}`} aria-label={`Visa profilen för ${author.name}`} className="text-slate-400 transition hover:text-ink"><Share2 size={18}/></Link></div>{collaborators.length > 0 && <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#201b35]"><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-sage">SAMARBETE I VISIONEN</p><div className="flex flex-wrap gap-2">{collaborators.map(collaborator => <Link key={collaborator.id} href={`/profile?user=${collaborator.id}`} className="flex items-center gap-2 rounded-full border border-black/5 px-2 py-1.5 text-xs font-semibold transition hover:bg-mint dark:border-white/10 dark:hover:bg-[#292044]"><Image src={collaborator.avatar} alt={`Profilbild för ${collaborator.name}`} width={24} height={24} className="rounded-full"/>{collaborator.name}</Link>)}</div></div>}</div><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-sage">{proposal.category} · {proposal.municipality}</p><h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{proposal.title}</h1><p className="mt-6 text-lg leading-relaxed text-slate-500">{proposal.description}</p><ProposalStats proposal={proposal}/>{isAuthenticated && <ProposalActions proposal={proposal}/>} {canDelete && <button type="button" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting} className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"><Trash2 size={15}/>{isDeleting ? "Tar bort..." : "Ta bort förslag"}</button>}</div></div>{canInvite && <div className="mt-10 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#201b35]">    <p className="text-xs font-bold uppercase tracking-[.16em] text-sage">{t("proposal.invite-collaborators")}</p><CollaboratorInviteForm proposalId={proposal.id} demoMode={demoMode}/></div>}<ProposalComments proposal={proposal} initialComments={[]} canComment={isAuthenticated === true}/></div></main>{showDeleteDialog && <ConfirmationDialog title={t("proposal.confirm-delete-title")} message={t("proposal.confirm-delete")} cancelLabel={t("proposal.cancel")} confirmLabel={t("proposal.delete")} onCancel={() => setShowDeleteDialog(false)} onConfirm={() => { setShowDeleteDialog(false); void handleDelete(); }}/>}</>;
}
