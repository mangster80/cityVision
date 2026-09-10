"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase";

type TranslationRow = {
  key: string;
  language: "sv" | "en";
  value: string;
};

type TranslationDraft = Record<string, { sv: string; en: string }>;

const adminId = "fdaade01-5f94-456b-ba84-647069363d45";

export default function TranslationAdminPage() {
  const [drafts, setDrafts] = useState<TranslationDraft>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Laddar...");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      if (!supabase) {
        setStatus("Supabase är inte konfigurerat.");
        setIsAdmin(false);
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userIsAdmin = authData.user?.id === adminId;
      if (!active) return;
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin) {
        setStatus("Du saknar behörighet.");
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
      if (active) setStatus(error instanceof Error ? error.message : "Översättningarna kunde inte hämtas.");
    });
    return () => {
      active = false;
    };
  }, []);

  const keys = useMemo(
    () => Object.keys(drafts).filter(key => key.toLowerCase().includes(query.toLowerCase())),
    [drafts, query],
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
    setStatus(error ? error.message : `Sparat: ${key}`);
  };

  if (isAdmin === false) {
    return <main className="px-5 pb-20 pt-32"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">Översättningsadmin</h1><p className="mt-3 text-slate-500">{status}</p></div></main>;
  }

  return <main className="px-5 pb-20 pt-32"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-sage">ADMIN</p><h1 className="mt-2 text-4xl font-semibold">Översättningar</h1><p className="mt-2 text-slate-500">Redigera svenska och engelska texter direkt i databasen.</p></div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Sök key..." className="field max-w-xs"/></div>{status && <p className="mb-5 text-sm text-slate-500">{status}</p>}<div className="space-y-3">{keys.map(key => <div key={key} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><p className="mb-3 font-mono text-xs text-sage">{key}</p><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><textarea value={drafts[key].sv} onChange={event => updateDraft(key, "sv", event.target.value)} className="field min-h-20 resize-y" aria-label={`${key} svenska`} /><textarea value={drafts[key].en} onChange={event => updateDraft(key, "en", event.target.value)} className="field min-h-20 resize-y" aria-label={`${key} engelska`} /><button type="button" onClick={() => void save(key)} disabled={savingKey === key} className="self-start rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{savingKey === key ? "Sparar..." : "Spara"}</button></div></div>)}</div></div></main>;
}
