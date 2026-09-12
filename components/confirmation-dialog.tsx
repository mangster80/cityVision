"use client";

export function ConfirmationDialog({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 px-5 backdrop-blur-sm animate-in fade-in">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1c1630] sm:p-8">
        <h2 className="text-xl font-bold tracking-tight text-ink dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sage dark:bg-white dark:text-ink dark:hover:bg-mint"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
