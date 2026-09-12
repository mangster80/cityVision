"use client";

import { useLanguage } from "@/components/language-provider";

type Profile = {
  id: string;
  name: string;
  auth_email: string | null;
  provider_email: string | null;
  provider: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
};

const onlineThresholdMs = 2 * 60 * 1000;

export function AdminUsersTable({ profiles, hasError = false }: { profiles: Profile[]; hasError?: boolean }) {
  const { t } = useLanguage();
  if (hasError) {
    return (
      <section>
        <h1 className="text-4xl font-semibold">{t("admin.users")}</h1>
        <p className="mt-4 text-red-600">{t("admin.users-load-error")}</p>
      </section>
    );
  }
  const currentTime = new Date().getTime();
  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })
      : t("admin.never");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">{t("admin.users")}</h1>
        <p className="mt-2 text-slate-500">
          {profiles.length} {t("admin.registered-users")}
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#201b35]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">{t("admin.users")} - {profiles.length} {t("admin.registered-users")}</caption>
          <thead className="border-b border-black/5 bg-slate-50/50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
            <tr>
              <th className="px-5 py-4">{t("admin.name")}</th>
              <th className="px-5 py-4">{t("admin.email")}</th>
              <th className="px-5 py-4">{t("admin.sign-in-method")}</th>
              <th className="px-5 py-4">{t("admin.role")}</th>
              <th className="px-5 py-4">{t("admin.registered")}</th>
              <th className="px-5 py-4">{t("admin.last-sign-in")}</th>
              <th className="px-5 py-4">{t("admin.status")}</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(profile => {
              const online =
                profile.last_seen_at &&
                currentTime - new Date(profile.last_seen_at).getTime() <= onlineThresholdMs;
              return (
                <tr key={profile.id} className="border-b border-black/5 transition hover:bg-slate-50/60 last:border-0 dark:border-white/10 dark:hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-semibold text-ink dark:text-white">{profile.name}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{profile.auth_email ?? profile.provider_email ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{profile.provider ?? "email"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{profile.role ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{new Date(profile.created_at).toLocaleDateString("sv-SE")}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(profile.last_sign_in_at)}</td>
                  <td className="px-5 py-4">
                    {online ? (
                      <span className="inline-flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                        <span aria-label={t("admin.online")} className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t("admin.online")}
                      </span>
                    ) : <span className="text-slate-400">{t("admin.offline")}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
