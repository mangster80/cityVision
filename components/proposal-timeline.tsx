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
}

export function ProposalTimeline({
  status = "idea",
  statusUpdatedAt,
  statusNote,
  createdAt,
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
      <div className="relative mt-5 mb-3">
        {/* Background connector line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-white/10" />

        {/* Active progress connector line */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-sage transition-all duration-500"
          style={{
            width: `calc(${(currentIndex / (PROPOSAL_STATUS_STEPS.length - 1)) * 100}% - 2rem)`,
          }}
        />

        <div className="relative z-10 flex justify-between">
          {PROPOSAL_STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;

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

            return (
              <div key={step.status} className="flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-all duration-300 ${stepCircleClass}`}
                >
                  {getStepIcon(step.status, isCompleted, isCurrent)}
                </div>
                <span
                  className={`mt-2 text-center text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "text-sage"
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
