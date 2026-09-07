"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoredUserRecord, updateStoredUserPreferences } from "@/services/user-storage";

interface ThemeContextValue {
  dark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredUserRecord()?.theme;
    if (savedTheme) {
      setDark(savedTheme === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", dark);
    updateStoredUserPreferences({ theme: dark ? "dark" : "light" });
  }, [dark, hydrated]);

  return <ThemeContext.Provider value={{ dark, toggleTheme: () => setDark(current => !current) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme måste användas inuti ThemeProvider");
  return context;
}
