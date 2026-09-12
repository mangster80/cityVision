"use client";
import Link from "next/link";
import {
  Building2,
  Compass,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PencilLine,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import {
  clearStoredUser,
  getStoredUser,
  isDemoLoginEnabled,
  setStoredUser,
} from "@/services/user-storage";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/services/supabase";
import {
  createAuthFallbackProfile,
  syncSupabaseProfile,
  updateSupabasePresence,
} from "@/services/profile-service";
import { users } from "@/data/mock-data";

const translationAdminId = "fdaade01-5f94-456b-ba84-647069363d45";

export function Header() {
  const { dark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] =
    useState<ReturnType<typeof getStoredUser>>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const isTranslationAdmin = currentUser?.id === translationAdminId;
  useEffect(() => {
    const syncSession = async (showLoginToast = false) => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setCurrentUser(storedUser);
        setIsAuthenticated(true);
        if (showLoginToast)
          showToast(
            t("header.logged-in-as").replace("{name}", storedUser.name),
          );
        return;
      }

      if (!supabase) {
        if (isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setCurrentUser(demoUser);
          setIsAuthenticated(true);
          if (showLoginToast)
            showToast(
              t("header.logged-in-as").replace("{name}", demoUser.name),
            );
          return;
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setCurrentUser(demoUser);
          setIsAuthenticated(true);
          if (showLoginToast)
            showToast(
              t("header.logged-in-as").replace("{name}", demoUser.name),
            );
          return;
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);

      try {
        const user = await syncSupabaseProfile(
          createAuthFallbackProfile(data.user),
          data.user,
        );
        setStoredUser(user);
        setCurrentUser(user);
        if (showLoginToast)
          showToast(t("header.logged-in-as").replace("{name}", user.name));
      } catch (profileError) {
        console.error(
          "Could not synchronize the authenticated user profile.",
          profileError,
        );
        setCurrentUser(null);
      }
    };
    const handleLogin = () => {
      void syncSession(true);
    };
    const handleAuthChange = () => {
      void syncSession();
    };
    void syncSession();
    window.addEventListener("cityvision-auth-change", handleAuthChange);
    window.addEventListener("cityvision-auth-login", handleLogin);
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => {
      void syncSession();
    }) ?? { data: { subscription: null } };
    return () => {
      window.removeEventListener("cityvision-auth-change", handleAuthChange);
      window.removeEventListener("cityvision-auth-login", handleLogin);
      authListener.subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!currentUser || !supabase) return;
    const updatePresence = () => {
      void updateSupabasePresence(currentUser.id).catch(error =>
        console.error("Could not update user presence.", error),
      );
    };
    updatePresence();
    const interval = window.setInterval(updatePresence, 60_000);
    return () => window.clearInterval(interval);
  }, [currentUser]);
  useEffect(() => {
    if (!menuOpen) return;

    const closeMenuOnOutsidePress = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenuOnOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", closeMenuOnOutsidePress);
  }, [menuOpen]);
  const handleLogout = () => {
    setMenuOpen(false);
    void supabase?.auth.signOut();
    clearStoredUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("cityvision-auth-change"));
    showToast(t("header.you-are-logged-out"));
    router.push("/explore");
  };
  return (
    <header className="fixed inset-x-0 top-0 z-[1000] px-4 pt-4 sm:px-8">
      <nav
        ref={navigationRef}
        aria-label="Huvudmeny"
        className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6"
      >
        <Link
          href="/"
          aria-label="StadsLyfts startsida"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="brand-gradient grid h-8 w-8 place-items-center rounded-xl text-white">
            <Building2 size={18} />
          </span>
          <span>
            Stads<span className="gradient-text">Lyft</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
          <Link
            href="/explore"
            className="hover:text-ink dark:hover:text-white"
          >
            {t("header.explore")}
          </Link>
          {isAuthenticated && (
            <Link
              href="/create"
              className="hover:text-ink dark:hover:text-white"
            >
              {t("header.create-proposal")}
            </Link>
          )}
          <Link href="/about" className="hover:text-ink dark:hover:text-white">
            {t("header.about-stadslyft")}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={
              language === "sv"
                ? t("header.switch-to-english")
                : t("header.switch-to-swedish")
            }
            onClick={toggleLanguage}
            className="hidden rounded-full px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 md:block"
          >
            {language.toUpperCase()}
          </button>
          <button
            aria-label={
              dark
                ? t("header.switch-theme-light")
                : t("header.switch-theme-dark")
            }
            onClick={toggleTheme}
            className="grid h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                aria-label={t("header.open-profile")}
                className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] sm:flex"
              >
                <UserRound size={15} />{" "}
                {currentUser?.name.split(/\s+/)[0] ?? t("header.my-profile")}
              </Link>{" "}
              <button
                onClick={handleLogout}
                aria-label={t("header.log-out")}
                className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10 sm:flex"
              >
                <LogOut size={15} /> {t("header.log-out")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] sm:flex"
            >
              <UserRound size={15} /> {t("header.log-in")}
            </Link>
          )}
          <button
            aria-label={
              menuOpen
                ? t("header.close-menu")
                : t("header.open-menu")
            }
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 items-center justify-center rounded-full text-ink dark:text-white lg:hidden"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {menuOpen && (
          <div className="absolute inset-x-3 top-[calc(100%+.5rem)] rounded-2xl border border-white/80 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1d1830] lg:hidden">
            <Link
              onClick={() => setMenuOpen(false)}
              href="/explore"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
            >
              <Compass size={17} className="text-sage" /> {t("header.explore")}
            </Link>
            {isAuthenticated && (
              <Link
                onClick={() => setMenuOpen(false)}
                href="/create"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
              >
                <PencilLine size={17} className="text-sage" />{" "}
                {t("header.create-proposal")}
              </Link>
            )}
            <Link
              onClick={() => setMenuOpen(false)}
              href="/about"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
            >
              <Compass size={17} className="text-sage" />{" "}
              {t("header.about-stadslyft")}
            </Link>
            {isAuthenticated && (
              <>
                {
                  <Link
                    onClick={() => setMenuOpen(false)}
                    href="/profile"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
                  >
                    <UserRound size={17} className="text-sage" />{" "}
                    {t("header.my-profile")}
                  </Link>
                }
                {isTranslationAdmin && (
                  <Link
                    onClick={() => setMenuOpen(false)}
                    href="/admin"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
                  >
                    <ShieldCheck size={17} className="text-sage" />{" "}
                    {t("header.translation-admin")}
                  </Link>
                )}
              </>
            )}
            <button
              onClick={() => {
                toggleLanguage();
                setMenuOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
            >
              <span className="flex items-center gap-3">
                <Languages size={17} className="text-sage" />{" "}
                {t("header.language")}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                {language === "sv" ? "English" : "Svenska"}
              </span>
            </button>
            <div className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
                >
                  <LogOut size={17} /> {t("header.log-out")}
                </button>
              ) : (
                <Link
                  onClick={() => setMenuOpen(false)}
                  href="/login"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"
                >
                  <LogIn size={17} className="text-sage" /> {t("header.log-in")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
