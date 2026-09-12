"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Send, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Comment, Proposal } from "@/types";
import { getProposalInteraction, proposalChangeEventName, updateProposalCommentCount, updateProposalSupporterCount, updateProposalVoteCount } from "@/services/proposal-interactions";
import { hasProposalSupport, toggleProposalSupport } from "@/services/proposal-support-service";
import { createProposalComment, deleteProposalComment, listProposalComments } from "@/services/proposal-comments-service";
import { getProposalVote, toggleProposalVote } from "@/services/proposal-vote-service";
import { useLanguage } from "@/components/language-provider";
import { getStoredUser, isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useToast } from "@/components/toast-provider";

export function ProposalActions({ proposal }: { proposal: Proposal }) {
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const [votes, setVotes] = useState(proposal.votes);
  const [supported, setSupported] = useState(false);
  const [supporters, setSupporters] = useState(proposal.supporters);
  const [isVoting, setIsVoting] = useState(false);
  const [isSupporting, setIsSupporting] = useState(false);
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const syncInteraction = () => {
      const interaction = getProposalInteraction(proposal.id, { votes: proposal.votes, supporters: proposal.supporters, comments: proposal.comments });
      setVotes(interaction.votes);
      setSupporters(interaction.supporters);
    };
    syncInteraction();
    window.addEventListener(proposalChangeEventName(), syncInteraction);
    return () => window.removeEventListener(proposalChangeEventName(), syncInteraction);
  }, [proposal.id, proposal.comments, proposal.supporters, proposal.votes]);

  useEffect(() => {
    void hasProposalSupport(proposal.id).then(setSupported).catch(() => setSupported(false));
  }, [proposal.id]);

  useEffect(() => {
    void getProposalVote(proposal.id).then(setVote).catch(() => setVote(0));
  }, [proposal.id]);

  const handleVote = async (nextVote: 1 | -1) => {
    if (isVoting) return;
    setIsVoting(true);

    const prevVote = vote;
    const prevVotes = votes;
    const optimisticVote: 1 | -1 | 0 = prevVote === nextVote ? 0 : nextVote;
    const voteDelta = optimisticVote - prevVote;
    const optimisticVotes = prevVotes + voteDelta;

    // Optimistic UI update
    setVote(optimisticVote);
    setVotes(optimisticVotes);
    updateProposalVoteCount(proposal.id, optimisticVotes);

    try {
      const result = await toggleProposalVote(proposal.id, nextVote, prevVote);
      setVote(result.vote);
      if (result.votes !== optimisticVotes) {
        setVotes(result.votes);
        updateProposalVoteCount(proposal.id, result.votes);
      }
    } catch (error) {
      // Rollback on error
      setVote(prevVote);
      setVotes(prevVotes);
      updateProposalVoteCount(proposal.id, prevVotes);
      showToast(error instanceof Error ? error.message : t("proposalactions.could-not-update-vote"));
    } finally {
      setIsVoting(false);
    }
  };

  const handleSupport = async () => {
    if (isSupporting) return;
    setIsSupporting(true);

    const prevSupported = supported;
    const prevSupporters = supporters;
    const optimisticSupported = !prevSupported;
    const optimisticSupporters = prevSupporters + (optimisticSupported ? 1 : -1);

    // Optimistic UI update
    setSupported(optimisticSupported);
    setSupporters(optimisticSupporters);
    updateProposalSupporterCount(proposal.id, optimisticSupporters);

    try {
      const nextSupported = await toggleProposalSupport(proposal.id);
      if (nextSupported !== optimisticSupported) {
        const correctedSupporters = prevSupporters + (nextSupported ? 1 : -1);
        setSupported(nextSupported);
        setSupporters(correctedSupporters);
        updateProposalSupporterCount(proposal.id, correctedSupporters);
      }
    } catch (error) {
      // Rollback on error
      setSupported(prevSupported);
      setSupporters(prevSupporters);
      updateProposalSupporterCount(proposal.id, prevSupporters);
      showToast(error instanceof Error ? error.message : t("proposalactions.could-not-update-support"));
    } finally {
      setIsSupporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center rounded-full border border-black/10 bg-white p-1 shadow-sm">
        <button
          aria-label={t("proposalactions.upvote")}
          onClick={() => { void handleVote(1); }}
          className={`rounded-full p-2 transition-all duration-150 active:scale-90 ${vote === 1 ? "bg-mint text-sage scale-105" : "text-slate-400 hover:text-sage"}`}
        >
          <ThumbsUp size={17} className={`transition-transform duration-150 ${vote === 1 ? "fill-sage scale-110" : ""}`}/>
        </button>
        <span className="min-w-12 text-center text-sm font-semibold text-ink tabular-nums transition-all">{votes}</span>
        <button
          aria-label={t("proposalactions.downvote")}
          onClick={() => { void handleVote(-1); }}
          className={`rounded-full p-2 transition-all duration-150 active:scale-90 ${vote === -1 ? "bg-red-50 text-red-500 scale-105" : "text-slate-400 hover:text-red-500"}`}
        >
          <ThumbsDown size={17} className={`transition-transform duration-150 ${vote === -1 ? "fill-red-500 scale-110" : ""}`}/>
        </button>
      </div>
      <button
        onClick={() => { void handleSupport(); }}
        className={`group flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${supported ? "border border-sage bg-mint text-sage shadow-sm" : "bg-ink text-white hover:bg-sage"}`}
      >
        <Heart size={17} className={`transition-transform duration-200 ${supported ? "fill-sage scale-110" : "group-hover:scale-110"}`}/>
        {supported ? t("proposalactions.you-support-this-proposal") : t("proposalactions.i-support-this-proposal")}
        <span className="opacity-70 tabular-nums">· {supporters}</span>
      </button>
    </div>
  );
}

export function ProposalComments({ proposal, initialComments, canComment }: { proposal: Proposal; initialComments: Comment[]; canComment: boolean }) {
  const [commentList, setCommentList] = useState(initialComments);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const initials = (name: string) => name.split(/\s+/u).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const formatCommentTime = (value: string) => {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp) || currentTime === null) return value;
    const elapsedSeconds = (timestamp - currentTime) / 1000;
    const absoluteSeconds = Math.abs(elapsedSeconds);
    const [amount, unit] = absoluteSeconds < 60
      ? [elapsedSeconds, "second"]
      : absoluteSeconds < 3600
        ? [elapsedSeconds / 60, "minute"]
        : absoluteSeconds < 86400
          ? [elapsedSeconds / 3600, "hour"]
          : [elapsedSeconds / 86400, "day"];
    const roundedAmount = Math.round(amount);
    if (roundedAmount === 0) return t("proposalactions.just-now");
    return new Intl.RelativeTimeFormat(language === "en" ? "en-US" : "sv-SE", { numeric: "auto" })
      .format(roundedAmount, unit as Intl.RelativeTimeFormatUnit);
  };
  useEffect(() => {
    setCurrentTime(Date.now());
    const storedUser = getStoredUser();
    if (isDemoLoginEnabled()) {
      setCurrentUserId(storedUser?.id ?? "demo-user");
    } else {
      void supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    }
    void listProposalComments(proposal.id)
      .then(comments => {
        setCommentList(comments);
        updateProposalCommentCount(proposal.id, comments.length);
      })
      .catch(error => setCommentError(error instanceof Error ? error.message : t("proposalactions.could-not-load-comments")));
  }, [proposal.id, t]);
  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return;
    setDeletingCommentId(commentId);

    // Optimistic comment deletion
    const prevComments = commentList;
    const nextComments = prevComments.filter(item => item.id !== commentId);
    setCommentList(nextComments);
    updateProposalCommentCount(proposal.id, nextComments.length);

    try {
      await deleteProposalComment(commentId);
    } catch (error) {
      // Rollback on error
      setCommentList(prevComments);
      updateProposalCommentCount(proposal.id, prevComments.length);
      showToast(error instanceof Error ? error.message : t("proposalactions.could-not-delete-comment"));
    } finally {
      setDeletingCommentId(null);
    }
  };
  const requestDeleteComment = (commentId: string) => {
    if (!deletingCommentId) setPendingDeleteCommentId(commentId);
  };
  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = comment.trim();
    if (!body) return;
    try {
      const savedComment = await createProposalComment(proposal.id, body);
      setCommentList(current => {
        updateProposalCommentCount(proposal.id, current.length + 1);
        return [...current, savedComment];
      });
      setComment("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("proposalactions.could-not-add-comment"));
    }
  };
  return <div className="mt-10 border-t border-black/10 pt-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-semibold">{t("proposalactions.comments")} <span className="text-sm font-normal text-slate-400">({commentList.length})</span></h2>{commentError && <p role="alert" className="mb-4 text-sm text-red-600">{commentError}</p>}{commentList.map(item => <div key={item.id} className="mb-5 flex gap-3">{item.user.avatar ? <Image src={item.user.avatar} alt={`Profilbild för ${item.user.name}`} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover"/> : <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint text-xs font-bold text-sage">{initials(item.user.name)}</div>}<div className="rounded-2xl bg-white px-4 py-3"><p className="text-sm font-semibold">{item.user.name}</p><p className="mt-1 text-sm text-slate-500">{item.body}</p><div className="mt-2 flex items-center justify-between gap-4"><p className="text-xs text-slate-400">{formatCommentTime(item.createdAt)}</p>{currentUserId === item.user.id && <button type="button" aria-label={t("proposalactions.delete-comment")} onClick={() => requestDeleteComment(item.id)} disabled={deletingCommentId === item.id} className="text-slate-400 transition hover:text-red-600 disabled:opacity-50"><Trash2 size={14}/></button>}</div></div></div>)}{canComment && <form onSubmit={handleComment} className="mt-6 flex gap-2"><input value={comment} onChange={event => setComment(event.target.value)} placeholder={t("proposalactions.write-a-comment")} className="field"/><button aria-label={t("proposalactions.send-comment")} type="submit" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-white transition hover:bg-sage"><Send size={17}/></button></form>}{pendingDeleteCommentId && <ConfirmationDialog title={t("proposalactions.confirm-delete-title")} message={t("proposalactions.confirm-delete-comment")} cancelLabel={t("proposalactions.cancel")} confirmLabel={t("proposalactions.delete-comment")} onCancel={() => setPendingDeleteCommentId(null)} onConfirm={() => { const commentId = pendingDeleteCommentId; setPendingDeleteCommentId(null); void handleDeleteComment(commentId); }}/>}</div>;
}
