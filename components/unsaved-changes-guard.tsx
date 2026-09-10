"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

type PendingAction = () => void;

export function useUnsavedChangesGuard(isDirty: boolean) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = t("unsavedchangesguard.you-have-unsaved-changes-do-you-want-to-leave-this-page");
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
  }, [isDirty, router, t]);

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

  const dialog = pendingAction && <ConfirmationDialog
    title={t("unsavedchangesguard.leave-this-page")}
    message={t("unsavedchangesguard.you-have-unsaved-changes-do-you-want-to-leave-this-page")}
    cancelLabel={t("unsavedchangesguard.no-stay")}
    confirmLabel={t("unsavedchangesguard.yes-leave")}
    onCancel={cancelDiscard}
    onConfirm={confirmDiscard}
  />;

  return { requestDiscard, dialog };
}
