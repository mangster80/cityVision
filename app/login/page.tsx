"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";
import { users } from "@/data/mock-data";
import { setStoredUser } from "@/services/user-storage";
import { syncSupabaseProfile } from "@/services/profile-service";

function translateAuthError(message: string, translate: (swedish: string, english: string) => string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return translate("E-postadressen eller lösenordet är fel.", "The email or password is incorrect.");
  if (normalized.includes("user already registered")) return translate("Det finns redan ett konto med den e-postadressen.", "An account already exists for that email.");
  if (normalized.includes("email not confirmed")) return translate("Bekräfta din e-postadress innan du loggar in.", "Confirm your email address before signing in.");
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) return translate("För många försök. Vänta en stund och försök igen.", "Too many attempts. Please wait a moment and try again.");
  if (normalized === "auth_callback") return translate("Inloggningen kunde inte slutföras. Försök igen.", "Sign-in could not be completed. Please try again.");
  return message;
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) setError(translateAuthError(callbackError, t));
  }, [searchParams, t]);

  const redirectPath = searchParams.get("redirect")?.startsWith("/") ? searchParams.get("redirect")! : "/explore";

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase) {
      setError(t("Supabase är inte konfigurerat ännu. Lägg till variablerna i .env.local.", "Supabase is not configured yet. Add the variables in .env.local."));
      return;
    }
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}` } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError(translateAuthError(result.error.message, t));
      return;
    }
    if (isSignUp && !result.data.session) {
      setSent(true);
      showToast(t("Konto skapat. Kontrollera din e-post om bekräftelse krävs.", "Account created. Check your email if confirmation is required."));
      return;
    }
    try {
      setStoredUser(await syncSupabaseProfile(users[0]));
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : t("Profilen kunde inte skapas.", "The profile could not be created."));
      return;
    }
    window.dispatchEvent(new Event("cityvision-auth-change"));
    showToast(t("Du är inloggad", "You are signed in"));
    router.replace(redirectPath);
  };

  const handleMagicLink = async () => {
    setError("");
    if (!supabase) {
      setError(t("Supabase är inte konfigurerat ännu.", "Supabase is not configured yet."));
      return;
    }
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}` } });
    if (authError) {
      setError(translateAuthError(authError.message, t));
      return;
    }
    setSent(true);
    showToast(t("Magic link skickad", "Magic link sent"));
  };

  const handleMockLogin = () => {
    setStoredUser(users[0]);
    window.dispatchEvent(new Event("cityvision-auth-change"));
    showToast(t("Demoinloggning klar", "Demo sign-in complete"));
    router.replace(redirectPath);
  };

  return <main className="grid min-h-screen place-items-center px-5 pt-16">
    <div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 shadow-xl sm:p-10">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={15}/> {t("Till startsidan", "Back home")}</Link>
      <div className="mb-8"><div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><Compass size={22}/></div><h1 className="text-3xl font-semibold">{isSignUp ? t("Skapa konto", "Create account") : t("Logga in", "Sign in")}</h1><p className="mt-2 text-slate-500">{t("Använd e-post och lösenord för snabb testinloggning.", "Use email and password for quick test sign-in.")}</p></div>
      {sent ? <div className="rounded-2xl bg-mint p-5 text-center text-sm text-sage">{t("Kontrollera din inkorg om e-postbekräftelse krävs.", "Check your inbox if email confirmation is required.")}</div> : <form onSubmit={handlePasswordAuth} className="space-y-4"><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("Din e-postadress", "Your email address")} className="field"/><input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t("Lösenord (minst 6 tecken)", "Password (at least 6 characters)")} className="field"/>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white">{isSignUp ? t("Skapa konto", "Create account") : t("Logga in", "Sign in")}</button></form>}
      <button type="button" onClick={() => { setIsSignUp(current => !current); setSent(false); setError(""); }} className="mt-4 w-full text-sm font-semibold text-sage">{isSignUp ? t("Har du redan ett konto? Logga in", "Already have an account? Sign in") : t("Skapa ett nytt konto", "Create a new account")}</button>
      <button type="button" onClick={handleMagicLink} className="mt-3 w-full rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/15 dark:text-white">{t("Använd magic link istället", "Use magic link instead")}</button>
      {process.env.NODE_ENV !== "production" && <button type="button" onClick={handleMockLogin} className="mt-3 w-full rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/15 dark:text-white">{t("Fortsätt i demo-läge", "Continue in demo mode")}</button>}
    </div>
  </main>;
}
