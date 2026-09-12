"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/language-provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Unhandled application error.", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-32">
      <section className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-[#201b35]">
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">{t("error.title")}</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">{t("error.description")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sage dark:bg-white dark:text-ink dark:hover:bg-mint"
        >
          {t("error.retry")}
        </button>
      </section>
    </main>
  );
}
