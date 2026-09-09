"use client";

import { Heart, MessageCircle, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Proposal } from "@/types";
import { getProposalInteraction, proposalChangeEventName } from "@/services/proposal-interactions";
import { formatCost } from "@/lib/format";

export function ProposalStats({ proposal }: { proposal: Proposal }) {
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
      <div className="rounded-2xl bg-mint p-4"><ThumbsUp size={18} className="mb-3 text-sage"/><p className="text-xl font-semibold">{interaction.votes}</p><p className="text-xs text-slate-500">röster</p></div>
      <div className="rounded-2xl bg-mint p-4"><Heart size={18} className="mb-3 text-sage"/><p className="text-xl font-semibold">{interaction.supporters}</p><p className="text-xs text-slate-500">stödjer</p></div>
      <div className="rounded-2xl bg-mint p-4"><span className="mb-3 block text-lg text-sage">kr</span><p className="text-xl font-semibold">{formatCost(proposal.cost).replace(" kr","")}</p><p className="text-xs text-slate-500">uppskattat</p></div>
      <div className="rounded-2xl bg-mint p-4"><MessageCircle size={18} className="mb-3 text-sage"/><p className="text-xl font-semibold">{interaction.comments}</p><p className="text-xs text-slate-500">kommentarer</p></div>
    </div>
  );
}
