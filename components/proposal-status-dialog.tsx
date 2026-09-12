"use client";

import { useState } from "react";
import { Check, Loader2, MessageSquare, ShieldAlert, X } from "lucide-react";
import { ProposalStatus } from "@/types";
import { useLanguage } from "@/components/language-provider";
import { PROPOSAL_STATUS_STEPS, getStatusBadgeClasses } from "@/lib/proposal-status-config";

interface ProposalStatusDialogProps {
  open: boolean;
  currentStatus: ProposalStatus;
  currentNote?: string;
  proposalTitle: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (status: ProposalStatus, note: string) => Promise<void>;
}

export function ProposalStatusDialog({
  open,
  currentStatus,
  currentNote = "",
  proposalTitle,
  isSaving,
  onClose,
  onSave,
}: ProposalStatusDialogProps) {
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<ProposalStatus>(currentStatus);
  const [note, setNote] = useState<string>(currentNote);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(selectedStatus, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1c1630] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <ShieldAlert size={13} />
              {t("proposal.status.admin-label")}
            </span>
            <h2 id="status-dialog-title" className="mt-3 text-2xl font-bold tracking-tight text-ink dark:text-white">
              {t("proposal.status.update-title")}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {proposalTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("proposal.status.choose-status")}
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROPOSAL_STATUS_STEPS.map((step) => {
                const isSelected = selectedStatus === step.status;
                const badge = getStatusBadgeClasses(step.status);
                return (
                  <button
                    key={step.status}
                    type="button"
                    onClick={() => setSelectedStatus(step.status)}
                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/70 shadow-sm dark:border-purple-400 dark:bg-purple-950/40"
                        : "border-black/5 bg-slate-50/50 hover:bg-slate-100 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {t(step.translationKey)}
                      </span>
                      {isSelected && <Check size={16} className="text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                      {t(step.descriptionKey)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="status-note" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MessageSquare size={14} />
              {t("proposal.status.official-note-label")}
            </label>
            <textarea
              id="status-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("proposal.status.official-note-placeholder")}
              className="w-full rounded-2xl border border-black/10 bg-white p-3.5 text-sm leading-relaxed text-ink shadow-sm placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-white/10 dark:bg-[#141024] dark:text-white dark:placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400">
              {t("proposal.status.official-note-help")}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("common.save")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
