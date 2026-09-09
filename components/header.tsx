"use client";
import Link from "next/link";
import { Building2, Compass, Languages, LogIn, LogOut, Menu, Moon, PencilLine, Sun, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { clearStoredUser, getStoredUser, isDemoLoginEnabled, setStoredUser } from "@/services/user-storage";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/services/supabase";
import { syncSupabaseProfile } from "@/services/profile-service";
import { users } from "@/data/mock-data";

export function Header() {
  const { dark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  useEffect(() => {
    const syncSession = async () => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setCurrentUser(storedUser);
        setIsAuthenticated(true);
        return;
      }

      if (!supabase) {
        if (process.env.NODE_ENV !== "production" && isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setCurrentUser(demoUser);
          setIsAuthenticated(true);
          return;
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (process.env.NODE_ENV !== "production" && isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setCurrentUser(demoUser);
          setIsAuthenticated(true);
          return;
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);

      try {
        const user = await syncSupabaseProfile(users[0]);
        setStoredUser(user);
        setCurrentUser(user);
      } catch (profileError) {
        console.error("Could not synchronize the authenticated user profile.", profileError);
        setCurrentUser(null);
      }
    };
    void syncSession();
    window.addEventListener("cityvision-auth-change", syncSession);
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => { void syncSession(); }) ?? { data: { subscription: null } };
    return () => {
      window.removeEventListener("cityvision-auth-change", syncSession);
      authListener.subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;

    const closeMenuOnOutsidePress = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenuOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeMenuOnOutsidePress);
  }, [menuOpen]);
  const handleLogout = () => {
    setMenuOpen(false);
    void supabase?.auth.signOut();
    clearStoredUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("cityvision-auth-change"));
    showToast(t("Du är utloggad", "You are logged out"));
    router.push("/explore");
  };
  return <header className="fixed inset-x-0 top-0 z-[1000] px-4 pt-4 sm:px-8"><nav ref={navigationRef} className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
    <Link href="/" aria-label="StadsLyfts startsida" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="brand-gradient grid h-8 w-8 place-items-center rounded-xl text-white"><Building2 size={18}/></span><span>Stads<span className="gradient-text">Lyft</span></span></Link>
    <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex"><Link href="/explore" className="hover:text-ink dark:hover:text-white">{t("Utforska", "Explore")}</Link><Link href="/create" className="hover:text-ink dark:hover:text-white">{t("Skapa förslag", "Create proposal")}</Link><Link href="/about" className="hover:text-ink dark:hover:text-white">{t("Om Stadslyft", "About Stadslyft")}</Link></div>
    <div className="flex items-center gap-2"><button aria-label={language === "sv" ? "Byt till engelska" : "Byt till svenska"} onClick={toggleLanguage} className="hidden rounded-full px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10 md:block">{language.toUpperCase()}</button><button aria-label={dark ? "Byt till ljust tema" : "Byt till mörkt tema"} onClick={toggleTheme} className="grid h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>{isAuthenticated ? <><Link href="/profile" aria-label={t("Öppna profil", "Open profile")} className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] sm:flex"><UserRound size={15}/> {currentUser?.name.split(/\s+/)[0] ?? t("Min profil", "My profile")}</Link>    <button onClick={handleLogout} aria-label={t("Logga ut", "Log out")} className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10 sm:flex"><LogOut size={15}/> {t("Logga ut", "Log out")}</button></> : <Link href="/login" className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] sm:flex"><UserRound size={15}/> {t("Logga in", "Log in")}</Link>}<button aria-label={menuOpen ? "Stäng meny" : "Öppna meny"} onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 items-center justify-center rounded-full text-ink dark:text-white md:hidden">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button></div>
    {menuOpen && <div className="absolute inset-x-3 top-[calc(100%+.5rem)] rounded-2xl border border-white/80 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1d1830] md:hidden"><Link onClick={() => setMenuOpen(false)} href="/explore" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"><Compass size={17} className="text-sage"/> {t("Utforska", "Explore")}</Link><Link onClick={() => setMenuOpen(false)} href="/create" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"><PencilLine size={17} className="text-sage"/> {t("Skapa förslag", "Create proposal")}</Link>{isAuthenticated && <Link onClick={() => setMenuOpen(false)} href="/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"><UserRound size={17} className="text-sage"/> {t("Min profil", "My profile")}</Link>}<button onClick={() => { toggleLanguage(); setMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-mint dark:hover:bg-white/10"><span className="flex items-center gap-3"><Languages size={17} className="text-sage"/> {t("Språk", "Language")}</span><span className="text-xs font-bold text-slate-500 dark:text-slate-300">{language === "sv" ? "English" : "Svenska"}</span></button><div className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">{isAuthenticated ? <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"><LogOut size={17}/> {t("Logga ut", "Log out")}</button> : <Link onClick={() => setMenuOpen(false)} href="/login" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10"><LogIn size={17} className="text-sage"/> {t("Logga in", "Log in")}</Link>}</div></div>}
  </nav></header>;
}
