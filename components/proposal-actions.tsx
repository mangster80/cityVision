"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Comment, Proposal } from "@/types";
import { getProposalInteraction, proposalChangeEventName, updateProposalInteraction } from "@/services/proposal-interactions";
import { hasProposalSupport, toggleProposalSupport } from "@/services/proposal-support-service";
import { useLanguage } from "@/components/language-provider";

export function ProposalActions({ proposal }: { proposal: Proposal }) {
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const [votes, setVotes] = useState(proposal.votes);
  const [supported, setSupported] = useState(false);
  const [supporters, setSupporters] = useState(proposal.supporters);
  const { t } = useLanguage();
  useEffect(() => {
    const syncInteraction = () => {
      const interaction = getProposalInteraction(proposal.id, { votes: proposal.votes, supporters: proposal.supporters });
      setVotes(interaction.votes);
      setSupporters(interaction.supporters);
    };
    syncInteraction();
    window.addEventListener(proposalChangeEventName(), syncInteraction);
    return () => window.removeEventListener(proposalChangeEventName(), syncInteraction);
  }, [proposal.id, proposal.supporters, proposal.votes]);
  useEffect(() => {
    void hasProposalSupport(proposal.id).then(setSupported).catch(() => setSupported(false));
  }, [proposal.id]);

  const handleVote = (nextVote: 1 | -1) => {
    if (vote === nextVote) {
      setVote(0);
      setVotes(current => current - nextVote);
      updateProposalInteraction(proposal.id, { votes: votes - nextVote, supporters });
    } else {
      const nextVotes = votes + (vote === 0 ? nextVote : nextVote * 2);
      setVotes(nextVotes);
      setVote(nextVote);
      updateProposalInteraction(proposal.id, { votes: nextVotes, supporters });
    }
  };

  const handleSupport = async () => {
    try {
      const nextSupported = await toggleProposalSupport(proposal.id);
      const nextSupporters = supporters + (nextSupported ? 1 : -1);
      setSupported(nextSupported);
      setSupporters(nextSupporters);
      updateProposalInteraction(proposal.id, { votes, supporters: nextSupporters });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t("Kunde inte uppdatera stödet.", "Could not update support."));
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center rounded-full border border-black/10 bg-white p-1">
        <button aria-label={t("Rösta upp", "Upvote")} onClick={() => handleVote(1)} className={`rounded-full p-2 transition ${vote === 1 ? "bg-mint text-sage" : "text-slate-400 hover:text-sage"}`}><ThumbsUp size={17} className={vote === 1 ? "fill-sage" : ""}/></button>
        <span className="min-w-12 text-center text-sm font-semibold text-ink">{votes}</span>
        <button aria-label={t("Rösta ner", "Downvote")} onClick={() => handleVote(-1)} className={`rounded-full p-2 transition ${vote === -1 ? "bg-red-50 text-red-500" : "text-slate-400 hover:text-red-500"}`}><ThumbsDown size={17} className={vote === -1 ? "fill-red-500" : ""}/></button>
      </div>
      <button onClick={() => { void handleSupport(); }} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition ${supported ? "border border-sage bg-mint text-sage" : "bg-ink text-white hover:bg-sage"}`}><Heart size={17} className={supported ? "fill-sage" : ""}/> {supported ? t("Du stödjer förslaget", "You support this proposal") : t("Jag stödjer förslaget", "I support this proposal")} <span className="opacity-70">· {supporters}</span></button>
    </div>
  );
}

export function ProposalComments({ proposal, initialComments }: { proposal: Proposal; initialComments: Comment[] }) {
  const [commentList, setCommentList] = useState(initialComments);
  const [comment, setComment] = useState("");
  const { t } = useLanguage();
  const initials = (name: string) => name.split(/\s+/u).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const handleComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = comment.trim();
    if (!body) return;
    setCommentList(current => [...current, {
      id: `local-${Date.now()}`,
      proposalId: proposal.id,
      user: { id: "demo-user", name: "Du", avatar: "" },
      body,
      createdAt: t("just nu", "just now")
    }]);
    setComment("");
  };
  return <div className="mt-10 border-t border-black/10 pt-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">{t("Kommentarer", "Comments")} <span className="text-sm font-normal text-slate-400">({commentList.length})</span></h2>{commentList.map(item => <div key={item.id} className="mb-5 flex gap-3">{item.user.avatar ? <Image src={item.user.avatar} alt={`Profilbild för ${item.user.name}`} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover"/> : <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-sage">{initials(item.user.name)}</div>}<div className="rounded-2xl bg-white px-4 py-3"><p className="text-sm font-semibold">{item.user.name}</p><p className="mt-1 text-sm text-slate-500">{item.body}</p><p className="mt-2 text-xs text-slate-400">{item.createdAt}</p></div></div>)}<form onSubmit={handleComment} className="mt-6 flex gap-2"><input value={comment} onChange={event => setComment(event.target.value)} placeholder={t("Skriv en kommentar...", "Write a comment...")} className="field"/><button aria-label={t("Skicka kommentar", "Send comment")} type="submit" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-white transition hover:bg-sage"><Send size={17}/></button></form></div>;
}
