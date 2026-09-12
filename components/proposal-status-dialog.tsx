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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1c1630]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/5 px-5 py-4 dark:border-white/5 sm:px-6">
          <div className="min-w-0 pr-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <ShieldAlert size={12} />
              {t("proposal.status.admin-label")}
            </span>
            <h2 id="status-dialog-title" className="mt-1.5 text-lg font-bold tracking-tight text-ink dark:text-white sm:text-xl">
              {t("proposal.status.update-title")}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {proposalTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={t("common.cancel")}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="status-update-form" onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:space-y-5 sm:p-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("proposal.status.choose-status")}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PROPOSAL_STATUS_STEPS.map((step) => {
                  const isSelected = selectedStatus === step.status;
                  const badge = getStatusBadgeClasses(step.status);
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.status}
                      type="button"
                      onClick={() => setSelectedStatus(step.status)}
                      className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/70 shadow-xs dark:border-purple-400 dark:bg-purple-950/40"
                          : "border-black/5 bg-slate-50/60 hover:bg-slate-100 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none ${badge.bg} ${badge.text} ${badge.border}`}>
                          <StepIcon size={12} className="shrink-0" />
                          <span className="inline-block leading-none">{t(step.translationKey)}</span>
                        </span>
                        {isSelected && <Check size={14} className="text-purple-600 dark:text-purple-400" />}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                        {t(step.descriptionKey)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status-note" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MessageSquare size={13} />
                {t("proposal.status.official-note-label")}
              </label>
              <textarea
                id="status-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("proposal.status.official-note-placeholder")}
                className="w-full resize-none rounded-2xl border border-black/10 bg-white p-3 text-sm leading-relaxed text-ink shadow-xs placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 dark:border-white/10 dark:bg-[#141024] dark:text-white dark:placeholder:text-slate-500 sm:rows-3"
              />
              <p className="text-[10px] text-slate-400">
                {t("proposal.status.official-note-help")}
              </p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-black/5 bg-slate-50/50 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02] sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-[#201b35] dark:text-slate-300 dark:hover:bg-white/5"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
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
