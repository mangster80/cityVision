import { LucideIcon, Lightbulb, Clock, Hammer, Sparkles } from "lucide-react";
import { ProposalStatus } from "@/types";

export interface StatusStep {
  status: ProposalStatus;
  translationKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

export const PROPOSAL_STATUS_STEPS: StatusStep[] = [
  {
    status: "idea",
    translationKey: "proposal.status.idea",
    descriptionKey: "proposal.status.idea-desc",
    icon: Lightbulb,
  },
  {
    status: "review",
    translationKey: "proposal.status.review",
    descriptionKey: "proposal.status.review-desc",
    icon: Clock,
  },
  {
    status: "planned",
    translationKey: "proposal.status.planned",
    descriptionKey: "proposal.status.planned-desc",
    icon: Hammer,
  },
  {
    status: "completed",
    translationKey: "proposal.status.completed",
    descriptionKey: "proposal.status.completed-desc",
    icon: Sparkles,
  },
];

export function getStatusStepIndex(status: ProposalStatus = "idea"): number {
  const index = PROPOSAL_STATUS_STEPS.findIndex(step => step.status === status);
  return index === -1 ? 0 : index;
}

export function getStatusStep(status: ProposalStatus = "idea"): StatusStep {
  const step = PROPOSAL_STATUS_STEPS.find(s => s.status === status);
  return step ?? PROPOSAL_STATUS_STEPS[0];
}

export function getStatusBadgeClasses(status: ProposalStatus = "idea"): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  iconColor: string;
} {
  switch (status) {
    case "completed":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-500/30 dark:border-emerald-500/30",
        dot: "bg-emerald-500",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      };
    case "planned":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/15",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-500/30 dark:border-blue-500/30",
        dot: "bg-blue-500",
        iconColor: "text-blue-600 dark:text-blue-400",
      };
    case "review":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-500/30 dark:border-amber-500/30",
        dot: "bg-amber-500",
        iconColor: "text-amber-600 dark:text-amber-400",
      };
    case "idea":
    default:
      return {
        bg: "bg-violet-500/10 dark:bg-violet-500/15",
        text: "text-violet-700 dark:text-violet-300",
        border: "border-violet-500/30 dark:border-violet-500/30",
        dot: "bg-violet-500",
        iconColor: "text-violet-600 dark:text-violet-400",
      };
  }
}
