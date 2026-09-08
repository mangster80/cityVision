"use client";
import Link from "next/link";
import { Compass, LogOut, Menu, Moon, Plus, Search, Sun, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { clearStoredUser, getStoredUser } from "@/services/user-storage";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/services/supabase";
import { syncSupabaseProfile } from "@/services/profile-service";
import { users } from "@/data/mock-data";

export function Header() {
  const { dark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const router = useRouter();
  const { showToast } = useToast();
  useEffect(() => {
    const syncSession = async () => {
      const storedUser = getStoredUser();
      if (storedUser || !supabase) {
        setCurrentUser(storedUser);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Could not read the authentication session.", error);
        setCurrentUser(null);
        return;
      }
      if (!data.user) {
        setCurrentUser(null);
        return;
      }

      try {
        setCurrentUser(await syncSupabaseProfile(users[0]));
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
  const handleLogout = () => {
    void supabase?.auth.signOut();
    clearStoredUser();
    window.dispatchEvent(new Event("cityvision-auth-change"));
    showToast(t("Du är utloggad", "You are logged out"));
    router.push("/explore");
  };
  return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8"><nav className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
    <Link href="/" aria-label="cityVision startsida" className="flex items-center gap-2 text-lg font-bold tracking-tight"><span className="brand-gradient grid h-8 w-8 place-items-center rounded-xl text-white"><Compass size={18}/></span><span>city<span className="gradient-text">Vision</span></span></Link>
    <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex"><Link href="/explore" className="hover:text-ink dark:hover:text-white">{t("Utforska", "Explore")}</Link><Link href="/create" className="hover:text-ink dark:hover:text-white">{t("Skapa förslag", "Create proposal")}</Link><Link href="/about" className="hover:text-ink dark:hover:text-white">{t("Om CityVision", "About CityVision")}</Link></div>
    <div className="flex items-center gap-2"><button aria-label={language === "sv" ? "Byt till engelska" : "Byt till svenska"} onClick={toggleLanguage} className="rounded-full px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">{language.toUpperCase()}</button><button aria-label={dark ? "Byt till ljust tema" : "Byt till mörkt tema"} onClick={toggleTheme} className="grid h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>{currentUser ? <><Link href="/profile" aria-label={t("Öppna profil", "Open profile")} className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white sm:flex"><UserRound size={15}/> {currentUser.name.split(/\s+/)[0]}</Link>    <button onClick={handleLogout} aria-label={t("Logga ut", "Log out")} className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10 sm:flex"><LogOut size={15}/> {t("Logga ut", "Log out")}</button></> : <Link href="/login" className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white sm:flex"><UserRound size={15}/> {t("Logga in", "Log in")}</Link>}<Link href="/create" className="hidden h-9 w-9 place-items-center rounded-full bg-sage text-white sm:grid md:hidden"><Plus size={18}/></Link><button aria-label={menuOpen ? "Stäng meny" : "Öppna meny"} onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center rounded-full text-ink dark:text-white md:hidden">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button></div>
    {menuOpen && <div className="absolute inset-x-3 top-[calc(100%+.5rem)] rounded-2xl border border-white/80 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#1d1830] md:hidden"><Link onClick={() => setMenuOpen(false)} href="/explore" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10">{t("Utforska", "Explore")}</Link><Link onClick={() => setMenuOpen(false)} href="/create" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10">{t("Skapa förslag", "Create proposal")}</Link>{currentUser && <><Link onClick={() => setMenuOpen(false)} href="/profile" className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-mint dark:hover:bg-white/10">{t("Min profil", "My profile")}</Link><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"><LogOut size={15}/> {t("Logga ut", "Log out")}</button></>}</div>}
  </nav></header>;
}

export function SearchBar() { return <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm"><Search size={18} className="text-slate-400"/><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Sök efter platser, idéer eller områden..." /></div>; }
