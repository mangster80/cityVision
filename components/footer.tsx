"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function Footer() {
  const { t } = useLanguage();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
  return (
    <footer className="border-t border-black/5 bg-white/55 px-5 pb-8 pt-14 backdrop-blur-xl dark:border-white/10 dark:bg-[#17132a]/70 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight" aria-label={t("footer.home")}>
            <span>Stads<span className="gradient-text">Lyft</span></span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {t("footer.description")}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-sage">{t("footer.explore")}</p>
          <nav className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-300" aria-label={t("footer.navigation")}>
            <Link href="/explore" className="transition hover:text-sage">{t("footer.places")}</Link>
            <Link href="/create" className="transition hover:text-sage">{t("footer.share")}</Link>
            <Link href="/about" className="transition hover:text-sage">{t("footer.about-stadslyft")}</Link>
          </nav>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-sage">{t("footer.contact")}</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-300">
            <a href="mailto:hej@stadslyft.se" className="transition hover:text-sage">hej@stadslyft.se</a>
            <p>{t("footer.a-shared-space-for-better-urban-environments")}</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-black/5 pt-5 text-xs text-slate-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Stadslyft. {t("footer.rights")} · v{appVersion}</p>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
