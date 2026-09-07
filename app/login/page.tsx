"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { supabase } from "@/services/supabase";
import { useLanguage } from "@/components/language-provider";
import { users } from "@/data/mock-data";
import { setStoredUser } from "@/services/user-storage";

function translateAuthError(message: string, translate: (swedish: string, english: string) => string) {
  const normalized = decodeURIComponent(message).toLowerCase();
  if (normalized.includes("invalid email") || normalized.includes("email address is invalid")) return translate("Skriv in en giltig e-postadress.", "Enter a valid email address.");
  if (normalized.includes("email rate limit exceeded") || normalized.includes("over_email_send_rate_limit")) return translate("För många e-postförsök. Vänta en stund och försök igen.", "Too many email requests. Please wait a while and try again.");
  if (normalized.includes("invalid login credentials")) return translate("E-postadressen eller lösenordet är fel.", "The email or password is incorrect.");
  if (normalized.includes("user already registered")) return translate("Det finns redan ett konto med den e-postadressen.", "An account already exists for that email.");
  if (normalized.includes("email not confirmed")) return translate("Bekräfta din e-postadress innan du loggar in.", "Confirm your email address before signing in.");
  if (normalized.includes("signup is disabled") || normalized.includes("signups not allowed")) return translate("Registrering är inte tillgänglig just nu.", "Sign-up is not available right now.");
  if (normalized.includes("provider is disabled")) return translate("Den här inloggningsmetoden är inte aktiverad.", "This sign-in method is not enabled.");
  if (normalized.includes("redirect") && normalized.includes("not allowed")) return translate("Inloggningsadressen är inte godkänd i Supabase.", "This sign-in address is not allowed in Supabase.");
  if (normalized.includes("expired") || normalized.includes("invalid token") || normalized.includes("otp")) return translate("Länken har gått ut eller kan inte användas. Begär en ny magic link.", "The link has expired or cannot be used. Request a new magic link.");
  if (normalized.includes("rate limit") || normalized.includes("too many requests") || normalized.includes("for security purposes")) {
    const waitMatch = message.match(/after\s+(\d+)\s+seconds?/i);
    const waitSeconds = waitMatch?.[1];
    return translate(
      waitSeconds ? `Av säkerhetsskäl kan du begära en ny länk om ${waitSeconds} sekunder.` : "För många försök. Vänta en stund och försök igen.",
      waitSeconds ? `For security reasons, you can request a new link in ${waitSeconds} seconds.` : "Too many attempts. Please wait a moment and try again.",
    );
  }
  if (normalized === "auth_callback") return translate("Inloggningen kunde inte slutföras. Försök igen.", "Sign-in could not be completed. Please try again.");
  return message;
}

function LoginContent() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) setError(translateAuthError(callbackError, t));
  }, [searchParams, t]);

  const redirectPath = searchParams.get("redirect")?.startsWith("/") ? searchParams.get("redirect")! : "/explore";

  const handleMagicLink = async () => {
    setError("");
    if (!email.trim()) {
      setError(t("Skriv in din e-postadress först.", "Enter your email address first."));
      return;
    }
    if (isSending) return;
    setIsSending(true);
    if (!supabase) {
      setError(t("Supabase är inte konfigurerat ännu.", "Supabase is not configured yet."));
      setIsSending(false);
      return;
    }
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}` } });
      if (authError) {
        setError(translateAuthError(authError.message, t));
        return;
      }
      setSent(true);
      showToast(t("Magic link skickad", "Magic link sent"));
    } catch (requestError) {
      setError(translateAuthError(requestError instanceof Error ? requestError.message : "auth_request_failed", t));
    } finally {
      setIsSending(false);
    }
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
      <div className="mb-8"><div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><LockKeyhole size={21}/></div><h1 className="text-3xl font-semibold">{t("Logga in", "Sign in")}</h1><p className="mt-2 text-slate-500">{t("Logga in säkert utan lösenord med en magic link till din e-post.", "Sign in securely without a password using a magic link sent to your email.")}</p></div>
      {sent ? <div className="rounded-2xl bg-mint p-5 text-center text-sm text-sage">{t("Kontrollera din inkorg och klicka på länken för att logga in.", "Check your inbox and click the link to sign in.")}</div> : <div className="space-y-4"><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t("Din e-postadress", "Your email address")} className="field"/>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button type="button" onClick={handleMagicLink} disabled={isSending} className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">{isSending ? t("Skickar...", "Sending...") : t("Använd Magic Link", "Use magic link")}</button></div>}
      {process.env.NODE_ENV !== "production" && <button type="button" onClick={handleMockLogin} className="mt-3 w-full rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/15 dark:text-white">{t("Fortsätt i demo-läge", "Continue in demo mode")}</button>}
    </div>
  </main>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center px-5 pt-16"><p className="text-sm text-slate-500">Laddar...</p></main>}>
      <LoginContent />
    </Suspense>
  );
}
