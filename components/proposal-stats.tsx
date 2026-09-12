"use client";

import { Coins, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Proposal } from "@/types";
import { getProposalInteraction, proposalChangeEventName } from "@/services/proposal-interactions";
import { useLanguage } from "@/components/language-provider";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const initialValue = useRef(value);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1000;
    let animationFrame = 0;

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(initialValue.current * easedProgress));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return <>{displayValue.toLocaleString("sv-SE")}{suffix}</>;
}

export function ProposalStats({ proposal }: { proposal: Proposal }) {
  const { t } = useLanguage();
  const [interaction, setInteraction] = useState(() => ({
    votes: proposal.votes,
    supporters: proposal.supporters,
    comments: proposal.comments
  }));

  useEffect(() => {
    const syncInteraction = () => {
      setInteraction(getProposalInteraction(proposal.id, {
        votes: proposal.votes,
        supporters: proposal.supporters,
        comments: proposal.comments
      }));
    };
    syncInteraction();
    window.addEventListener(proposalChangeEventName(), syncInteraction);
    return () => window.removeEventListener(proposalChangeEventName(), syncInteraction);
  }, [proposal.id, proposal.comments, proposal.supporters, proposal.votes]);

  return (
    <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-2xl border border-sage/10 bg-mint p-4 dark:border-white/10 dark:bg-[#292044]">
        <ThumbsUp size={18} className="mb-3 text-sage" />
        <p className="text-xl font-semibold text-ink dark:text-white">
          <AnimatedNumber value={interaction.votes} />
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("proposalstats.votes")}
        </p>
      </div>
      <div className="rounded-2xl border border-sage/10 bg-mint p-4 dark:border-white/10 dark:bg-[#292044]">
        <Heart size={18} className="mb-3 text-sage" />
        <p className="text-xl font-semibold text-ink dark:text-white">
          <AnimatedNumber value={interaction.supporters} />
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("proposalstats.supporters")}
        </p>
      </div>
      <div className="rounded-2xl border border-sage/10 bg-mint p-4 dark:border-white/10 dark:bg-[#292044]">
        <Coins size={18} className="mb-3 text-sage" />
        <p className="text-xl font-semibold text-ink dark:text-white">
          <AnimatedNumber value={proposal.cost} suffix=" kr" />
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("proposalstats.estimated")}
        </p>
      </div>
      <div className="rounded-2xl border border-sage/10 bg-mint p-4 dark:border-white/10 dark:bg-[#292044]">
        <MessageCircle size={18} className="mb-3 text-sage" />
        <p className="text-xl font-semibold text-ink dark:text-white">
          <AnimatedNumber value={interaction.comments} />
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("proposalstats.comments")}
        </p>
      </div>
    </div>
  );
}
