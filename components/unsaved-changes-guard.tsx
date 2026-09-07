"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

type PendingAction = () => void;

export function useUnsavedChangesGuard(isDirty: boolean) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingAction(() => () => router.push(`${url.pathname}${url.search}${url.hash}`));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty, router]);

  const requestDiscard = useCallback((action: PendingAction) => {
    if (!isDirty) {
      action();
      return;
    }
    setPendingAction(() => action);
  }, [isDirty]);

  const cancelDiscard = useCallback(() => setPendingAction(null), []);
  const confirmDiscard = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }, [pendingAction]);

  const dialog = pendingAction && (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 px-5 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#201b35]">
        <h2 className="text-xl font-semibold">{t("Lämna sidan?", "Leave this page?")}</h2>
        <p className="mt-2 text-sm text-slate-500">{t("Du har osparade ändringar. Vill du lämna sidan?", "You have unsaved changes. Do you want to leave this page?")}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={cancelDiscard} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/15">{t("Nej, stanna kvar", "No, stay")}</button>
          <button type="button" onClick={confirmDiscard} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">{t("Ja, lämna", "Yes, leave")}</button>
        </div>
      </div>
    </div>
  );

  return { requestDiscard, dialog };
}
