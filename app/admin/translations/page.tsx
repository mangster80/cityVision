"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";

type TranslationRow = {
  key: string;
  language: "sv" | "en";
  value: string;
};

type TranslationDraft = Record<string, { sv: string; en: string }>;

const adminId = "fdaade01-5f94-456b-ba84-647069363d45";

export default function TranslationAdminPage() {
  const { t } = useLanguage();
  const [drafts, setDrafts] = useState<TranslationDraft>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [openScopes, setOpenScopes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      if (!supabase) {
        setStatus(t("admin.supabase-not-configured"));
        setIsAdmin(false);
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userIsAdmin = authData.user?.id === adminId;
      if (!active) return;
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin) {
        setStatus(t("admin.no-permission"));
        return;
      }
      const { data, error } = await supabase
        .from("translations")
        .select("key, language, value")
        .order("key");
      if (error) throw error;
      const nextDrafts: TranslationDraft = {};
      for (const row of (data ?? []) as TranslationRow[]) {
        nextDrafts[row.key] ??= { sv: "", en: "" };
        nextDrafts[row.key][row.language] = row.value;
      }
      if (active) {
        setDrafts(nextDrafts);
        setStatus("");
      }
    };
    void loadTranslations().catch(error => {
      if (active) setStatus(error instanceof Error ? error.message : t("admin.translations-load-error"));
    });
    return () => {
      active = false;
    };
  }, [t]);

  const scopes = useMemo(() => {
    const grouped = new Map<string, string[]>();
    const normalizedQuery = query.trim().toLowerCase();

    for (const key of Object.keys(drafts)) {
      if (normalizedQuery && !key.toLowerCase().includes(normalizedQuery)) {
        continue;
      }
      const scope = key.split(".")[0] || "general";
      grouped.set(scope, [...(grouped.get(scope) ?? []), key]);
    }

    return [...grouped.entries()].sort(([scopeA], [scopeB]) =>
      scopeA.localeCompare(scopeB),
    );
  }, [drafts, query]);

  const isScopeOpen = (scope: string) =>
    openScopes[scope] ?? query.trim().length > 0;

  const toggleScope = (scope: string) => {
    setOpenScopes(current => ({
      ...current,
      [scope]: !isScopeOpen(scope),
    }));
  };

  const formatScope = (scope: string) =>
    scope === "general"
      ? t("admin.general-scope")
      : scope.charAt(0).toUpperCase() + scope.slice(1);

  const filteredKeyCount = useMemo(
    () => scopes.reduce((count, [, keys]) => count + keys.length, 0),
    [scopes],
  );

  const updateDraft = (key: string, language: "sv" | "en", value: string) => {
    setDrafts(current => ({ ...current, [key]: { ...current[key], [language]: value } }));
  };

  const save = async (key: string) => {
    if (!supabase) return;
    setSavingKey(key);
    const values = drafts[key];
    const { error } = await supabase.from("translations").upsert([
      { key, language: "sv", value: values.sv },
      { key, language: "en", value: values.en },
    ]);
    setSavingKey(null);
    setStatus(error ? error.message : `${t("admin.saved")}: ${key}`);
  };

  if (isAdmin === false) {
    return <main className="px-5 pb-20 pt-32"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">{t("admin.translation-admin")}</h1><p className="mt-3 text-slate-500">{status}</p></div></main>;
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">{t("admin.translations")}</h1>
          <p className="mt-2 text-slate-500">{t("admin.translations-description")}</p>
        </div>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t("admin.search-key")}
          className="field max-w-xs"
        />
      </div>
      {status && <p className="mb-5 text-sm text-slate-500">{status}</p>}
      {filteredKeyCount === 0 && !status && (
        <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm dark:bg-[#201b35]">
          {t("admin.no-translations-found")}
        </p>
      )}
      <div className="space-y-4">
        {scopes.map(([scope, scopeKeys]) => {
          const isOpen = isScopeOpen(scope);
          return (
            <section
              key={scope}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#201b35]"
            >
              <button
                type="button"
                onClick={() => toggleScope(scope)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-black/[.03] dark:hover:bg-white/[.04]"
              >
                <span>
                  <span className="block text-lg font-semibold">
                    {formatScope(scope)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {scopeKeys.length} {t("admin.translations-count")}
                  </span>
                </span>
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-black/5 p-4 dark:border-white/10">
                  {scopeKeys.map(key => (
                    <div
                      key={key}
                      className="rounded-2xl border border-black/5 p-4 dark:border-white/10"
                    >
                      <p className="mb-3 font-mono text-xs text-sage">{key}</p>
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <textarea
                          value={drafts[key].sv}
                          onChange={event =>
                            updateDraft(key, "sv", event.target.value)
                          }
                          className="field min-h-20 resize-y"
                          aria-label={`${key} svenska`}
                        />
                        <textarea
                          value={drafts[key].en}
                          onChange={event =>
                            updateDraft(key, "en", event.target.value)
                          }
                          className="field min-h-20 resize-y"
                          aria-label={`${key} engelska`}
                        />
                        <button
                          type="button"
                          onClick={() => void save(key)}
                          disabled={savingKey === key}
                          className="self-start rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {savingKey === key ? t("admin.saving") : t("admin.save")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
