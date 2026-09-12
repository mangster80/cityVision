"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: "icon" | "button";
}

export function ShareButton({ title, text, url, variant = "icon" }: ShareButtonProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareText = text || `${title} – Stadslyft`;

    // 1. Web Share API (native share dialog on mobile devices: iOS Safari, Android Chrome, etc.)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // User dismissed the native dialog
        if (error instanceof DOMException && (error.name === "AbortError" || error.code === 20)) {
          return;
        }
        // If navigator.share fails for any other reason, gracefully fall through to clipboard
      }
    }

    // 2. Fallback to Clipboard API with visual indicator and toast
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Legacy fallback
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast(t("proposal.link-copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t("proposal.share-error"));
    }
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => void share()}
        aria-label={t("proposal.share")}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sage hover:bg-mint hover:text-sage active:scale-95 dark:border-white/10 dark:bg-[#201b35] dark:text-slate-200 dark:hover:bg-[#292044]"
      >
        {copied ? (
          <>
            <Check size={16} className="text-sage animate-in zoom-in-50" />
            <span>{t("proposal.link-copied")}</span>
          </>
        ) : (
          <>
            <Share2 size={16} />
            <span>{t("proposal.share")}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={t("proposal.share")}
      title={copied ? t("proposal.link-copied") : t("proposal.share")}
      className={`group relative grid h-10 w-10 place-items-center rounded-xl border transition-all active:scale-90 ${
        copied
          ? "border-sage/40 bg-mint text-sage"
          : "border-black/5 bg-slate-50/80 text-slate-500 hover:border-sage/30 hover:bg-mint/80 hover:text-sage dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-[#292044]"
      }`}
    >
      {copied ? (
        <Check size={18} className="text-sage animate-in zoom-in-75 duration-150" />
      ) : (
        <Share2 size={18} className="transition-transform duration-200 group-hover:scale-110" />
      )}
    </button>
  );
}
