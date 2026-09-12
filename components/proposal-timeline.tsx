"use client";

import { Check, Clock, FileCheck2, Hammer, Lightbulb, Sparkles } from "lucide-react";
import { ProposalStatus } from "@/types";
import { useLanguage } from "@/components/language-provider";
import {
  getStatusBadgeClasses,
  getStatusStepIndex,
  PROPOSAL_STATUS_STEPS,
} from "@/lib/proposal-status-config";

interface ProposalTimelineProps {
  status?: ProposalStatus;
  statusUpdatedAt?: string;
  statusNote?: string;
  createdAt?: string;
  canEditStatus?: boolean;
  onEditStatusClick?: () => void;
}

export function ProposalTimeline({
  status = "idea",
  statusUpdatedAt,
  statusNote,
  createdAt,
  canEditStatus = false,
  onEditStatusClick,
}: ProposalTimelineProps) {
  const { t, language } = useLanguage();
  const currentIndex = getStatusStepIndex(status);
  const badge = getStatusBadgeClasses(status);

  const getStepIcon = (stepStatus: ProposalStatus, isDone: boolean, isCurrent: boolean) => {
    if (isDone) {
      return <Check size={14} className="stroke-[3]" />;
    }
    switch (stepStatus) {
      case "idea":
        return <Lightbulb size={14} className={isCurrent ? "animate-pulse" : ""} />;
      case "review":
        return <Clock size={14} className={isCurrent ? "animate-pulse" : ""} />;
      case "planned":
        return <Hammer size={14} className={isCurrent ? "animate-pulse" : ""} />;
      case "completed":
        return <Sparkles size={14} className={isCurrent ? "animate-pulse" : ""} />;
    }
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      return new Intl.DateTimeFormat(language === "en" ? "en-US" : "sv-SE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return null;
    }
  };

  const activeDate = formatDate(statusUpdatedAt || createdAt);

  return (
    <div className="my-6 rounded-2xl border border-black/5 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#201b35]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileCheck2 size={16} className="text-sage" />
          <span className="text-xs font-bold uppercase tracking-[.16em] text-sage">
            {t("proposal.timeline-title")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEditStatus && (
            <button
              type="button"
              onClick={onEditStatusClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
            >
              {t("proposal.update-status-button")}
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot} animate-pulse`} />
            {t(PROPOSAL_STATUS_STEPS[currentIndex].translationKey)}
          </span>
          {activeDate && (
            <span className="text-xs text-slate-400">· {activeDate}</span>
          )}
        </div>
      </div>

      {/* Interactive / visual stepper bar */}
      <div className="relative mt-6 mb-4 px-1">
        {/* Background connector line centered through the icons (left 16px to right 16px, top 16px) */}
        <div className="absolute left-5 right-5 top-4 -translate-y-1/2 h-1 rounded-full bg-slate-100 dark:bg-white/10" />

        {/* Active progress connector line */}
        <div
          className="absolute left-5 top-4 -translate-y-1/2 h-1 rounded-full bg-sage transition-all duration-500 ease-out"
          style={{
            width: `calc(${(currentIndex / (PROPOSAL_STATUS_STEPS.length - 1)) * 100}% - ${(currentIndex / (PROPOSAL_STATUS_STEPS.length - 1)) * 2.5}rem)`,
          }}
        />

        <div className="relative z-10 flex items-start justify-between">
          {PROPOSAL_STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            let stepCircleClass = "";
            if (isCompleted) {
              stepCircleClass = "bg-sage text-white border-sage shadow-xs";
            } else if (isCurrent) {
              stepCircleClass =
                "bg-mint text-sage border-sage ring-4 ring-sage/20 scale-110 shadow-sm dark:bg-[#292044]";
            } else {
              stepCircleClass =
                "bg-white text-slate-400 border-slate-200 dark:bg-[#201b35] dark:border-white/20 dark:text-slate-500";
            }

            const alignClass =
              idx === 0
                ? "items-start text-left"
                : idx === PROPOSAL_STATUS_STEPS.length - 1
                ? "items-end text-right"
                : "items-center text-center";

            return (
              <div
                key={step.status}
                className={`flex flex-col ${alignClass} max-w-[22%]`}
              >
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-all duration-300 ${stepCircleClass}`}
                >
                  {getStepIcon(step.status, isCompleted, isCurrent)}
                </div>
                <span
                  className={`mt-2.5 text-[11px] sm:text-xs font-semibold leading-tight transition-colors ${
                    isCurrent
                      ? "text-sage font-bold"
                      : isCompleted
                      ? "text-ink dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {t(step.translationKey)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step explanation */}
      <div className="mt-4 rounded-xl bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600 dark:bg-white/5 dark:text-slate-300">
        <p className="font-semibold text-ink dark:text-white mb-0.5">
          {t(PROPOSAL_STATUS_STEPS[currentIndex].translationKey)}:
        </p>
        <p>{t(PROPOSAL_STATUS_STEPS[currentIndex].descriptionKey)}</p>
        {statusNote && (
          <div className="mt-2 border-t border-black/5 pt-2 text-slate-500 dark:border-white/10">
            <span className="font-semibold text-ink dark:text-white">
              {t("proposal.status.note")}:
            </span>{" "}
            {statusNote}
          </div>
        )}
      </div>
    </div>
  );
}
