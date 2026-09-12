import { ProposalStatus } from "@/types";

export interface StatusStep {
  status: ProposalStatus;
  translationKey: string;
  descriptionKey: string;
}

export const PROPOSAL_STATUS_STEPS: StatusStep[] = [
  {
    status: "idea",
    translationKey: "proposal.status.idea",
    descriptionKey: "proposal.status.idea-desc",
  },
  {
    status: "review",
    translationKey: "proposal.status.review",
    descriptionKey: "proposal.status.review-desc",
  },
  {
    status: "planned",
    translationKey: "proposal.status.planned",
    descriptionKey: "proposal.status.planned-desc",
  },
  {
    status: "completed",
    translationKey: "proposal.status.completed",
    descriptionKey: "proposal.status.completed-desc",
  },
];

export function getStatusStepIndex(status: ProposalStatus = "idea"): number {
  const index = PROPOSAL_STATUS_STEPS.findIndex(step => step.status === status);
  return index === -1 ? 0 : index;
}

export function getStatusBadgeClasses(status: ProposalStatus = "idea"): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "completed":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800/40",
        dot: "bg-emerald-500",
      };
    case "planned":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800/40",
        dot: "bg-blue-500",
      };
    case "review":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800/40",
        dot: "bg-amber-500",
      };
    case "idea":
    default:
      return {
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-700 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800/40",
        dot: "bg-purple-500",
      };
  }
}
