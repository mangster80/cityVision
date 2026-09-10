"use client";

import { Share2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";

export function ShareButton({ title }: { title: string }) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(t("proposal.link-copied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast(t("proposal.share-error"));
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={t("proposal.share")}
      className="text-slate-400 transition hover:text-ink"
    >
      <Share2 size={18} />
    </button>
  );
}
