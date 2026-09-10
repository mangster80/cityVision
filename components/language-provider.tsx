"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoredUserRecord, updateStoredUserPreferences } from "@/services/user-storage";
import { supabase } from "@/services/supabase";
import sv from "@/locales/sv.json";
import en from "@/locales/en.json";

export type Language = "sv" | "en";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, english?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const localeFiles = { sv, en };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("sv");
  const [databaseTranslations, setDatabaseTranslations] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    const savedLanguage = getStoredUserRecord()?.language;
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    updateStoredUserPreferences({ language });
    if (supabase) {
      void supabase.from("translations").select("key, value").eq("language", language).then(({ data, error }) => {
        if (error) {
          console.error("Could not load translations from Supabase.", error);
          return;
        }
        setDatabaseTranslations(Object.fromEntries((data ?? []).map(row => [row.key, row.value])));
      });
    }
    const translateDom = () => {
      const current = localeFiles[language];
      const replacements = Object.fromEntries(
        Object.keys(sv).map(key => [
          language === "sv" ? en[key as keyof typeof en] : sv[key as keyof typeof sv],
          current[key as keyof typeof sv]
        ])
      );
      const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = nodes.nextNode())) {
        const value = node.textContent?.trim();
        if (value && replacements[value]) node.textContent = node.textContent?.replace(value, replacements[value]) || "";
      }
      document.querySelectorAll<HTMLElement>("[placeholder], [aria-label]").forEach(element => {
        for (const attribute of ["placeholder", "aria-label"]) {
          const value = element.getAttribute(attribute);
          if (value && replacements[value]) element.setAttribute(attribute, replacements[value]);
        }
      });
    };
    const observer = new MutationObserver(translateDom);
    observer.observe(document.body, { childList: true, subtree: true });
    translateDom();
    return () => observer.disconnect();
  }, [language]);

  const t = (key: string, english?: string) => {
    if (databaseTranslations[key]) return databaseTranslations[key];
    if (english !== undefined) return language === "sv" ? key : english;
    return localeFiles[language][key as keyof typeof sv] ?? key;
  };

  return <LanguageContext.Provider value={{ language, toggleLanguage: () => setLanguage(current => current === "sv" ? "en" : "sv"), t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage måste användas inuti LanguageProvider");
  return context;
}
