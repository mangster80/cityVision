"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function AdminPage() {
  const { t } = useLanguage();
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">{t("admin.title")}</h1>
        <p className="mt-2 text-slate-500">{t("admin.choose-section")}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/users"
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#201b35] dark:hover:border-white/20"
        >
          <h2 className="text-xl font-semibold text-ink dark:text-white">{t("admin.users")}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("admin.users-description")}</p>
        </Link>
        <Link
          href="/admin/translations"
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#201b35] dark:hover:border-white/20"
        >
          <h2 className="text-xl font-semibold text-ink dark:text-white">{t("admin.translations")}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("admin.translations-description")}</p>
        </Link>
      </div>
    </section>
  );
}
