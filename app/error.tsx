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
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-[#201b35]">
        <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
        <p className="mt-3 text-slate-500">{t("error.description")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          {t("error.retry")}
        </button>
      </section>
    </main>
  );
}
