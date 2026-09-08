"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Github, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/components/language-provider";
import { users } from "@/data/mock-data";
import { setStoredUser } from "@/services/user-storage";

function getRateLimitSeconds(message: string) {
  const waitMatch = message.match(/after\s+(\d+)\s+seconds?/i) ?? message.match(/\b(\d+)\s+seconds?\b/i);
  const waitSeconds = waitMatch?.[1];
  return waitSeconds ? Number(waitSeconds) : null;
}

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
  if (normalized.includes("pkce code verifier not found")) return translate("Inloggningen kunde inte slutföras. Starta om och försök igen i samma webbläsare.", "Sign-in could not be completed. Start again and try in the same browser.");
  if (normalized.includes("expired") || normalized.includes("invalid token") || normalized.includes("otp")) return translate("Länken har gått ut eller kan inte användas. Begär en ny magic link.", "The link has expired or cannot be used. Request a new magic link.");
  if (normalized.includes("rate limit") || normalized.includes("too many requests") || normalized.includes("for security purposes")) {
    const waitSeconds = getRateLimitSeconds(message);
    return translate(
      waitSeconds ? `Av säkerhetsskäl kan du begära en ny länk om ${waitSeconds} sekunder.` : "För många försök. Vänta en stund och försök igen.",
      waitSeconds ? `For security reasons, you can request a new link in ${waitSeconds} seconds.` : "Too many attempts. Please wait a moment and try again.",
    );
  }
  if (normalized === "auth_callback") return translate("Inloggningen kunde inte slutföras. Försök igen.", "Sign-in could not be completed. Please try again.");
  return message;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

function LoginContent() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [errorSource, setErrorSource] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSigningInWithGitHub, setIsSigningInWithGitHub] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (!callbackError) {
      setErrorSource(null);
      setRateLimitSeconds(null);
      setError("");
      return;
    }

    setErrorSource(callbackError);
    const waitSeconds = getRateLimitSeconds(callbackError);
    setRateLimitSeconds(waitSeconds);
    setError(waitSeconds ? t(`Av säkerhetsskäl kan du begära en ny länk om ${waitSeconds} sekunder.`, `For security reasons, you can request a new link in ${waitSeconds} seconds.`) : translateAuthError(callbackError, t));
  }, [searchParams, t]);

  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRateLimitSeconds(current => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rateLimitSeconds]);

  useEffect(() => {
    if (!errorSource || getRateLimitSeconds(errorSource) === null) return;
    setError(t(`Av säkerhetsskäl kan du begära en ny länk om ${rateLimitSeconds ?? getRateLimitSeconds(errorSource)} sekunder.`, `For security reasons, you can request a new link in ${rateLimitSeconds ?? getRateLimitSeconds(errorSource)} seconds.`));
  }, [errorSource, rateLimitSeconds, t]);

  const redirectPath = searchParams.get("redirect")?.startsWith("/") ? searchParams.get("redirect")! : "/explore";

  const handleMagicLink = async () => {
    setError("");
    setErrorSource(null);
    setRateLimitSeconds(null);
    if (!isValidEmail(email)) {
      setError(t("Skriv in en giltig e-postadress.", "Enter a valid email address."));
      return;
    }
    if (isSending) return;
    setIsSending(true);
    try {
      const response = await fetch("/auth/magic-link/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), next: redirectPath }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : "auth_request_failed";
        const waitSeconds = getRateLimitSeconds(message);
        setErrorSource(message);
        setRateLimitSeconds(waitSeconds);
        setError(waitSeconds ? t(`Av säkerhetsskäl kan du begära en ny länk om ${waitSeconds} sekunder.`, `For security reasons, you can request a new link in ${waitSeconds} seconds.`) : translateAuthError(message, t));
        return;
      }
      setSent(true);
      showToast(t("Magic link skickad", "Magic link sent"));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "auth_request_failed";
      const waitSeconds = getRateLimitSeconds(message);
      setErrorSource(message);
      setRateLimitSeconds(waitSeconds);
      setError(waitSeconds ? t(`Av säkerhetsskäl kan du begära en ny länk om ${waitSeconds} sekunder.`, `For security reasons, you can request a new link in ${waitSeconds} seconds.`) : translateAuthError(message, t));
    } finally {
      setIsSending(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError("");
    setIsSigningInWithGitHub(true);
    window.location.assign(`/auth/oauth/start?next=${encodeURIComponent(redirectPath)}`);
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
      {sent ? <div className="rounded-2xl bg-mint p-5 text-center text-sm text-sage">{t("Kontrollera din inkorg och klicka på länken för att logga in.", "Check your inbox and click the link to sign in.")}</div> : <><form onSubmit={event => { event.preventDefault(); void handleMagicLink(); }} className="space-y-4"><input required type="email" inputMode="email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); if (error) setError(""); }} placeholder={t("Din e-postadress", "Your email address")} title={t("Skriv in en giltig e-postadress.", "Please enter a valid email address.")} onInvalid={(event) => { event.preventDefault(); setError(t("Skriv in en giltig e-postadress.", "Please enter a valid email address.")); }} className="field"/>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button type="submit" disabled={isSending} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:cursor-wait disabled:opacity-70"><Mail size={18}/>{isSending ? t("Skickar...", "Sending...") : t("Använd Magic Link", "Use magic link")}</button></form><div className="my-5 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-black/10 after:h-px after:flex-1 after:bg-black/10">{t("eller", "or")}</div><button type="button" onClick={() => { void handleGitHubLogin(); }} disabled={isSigningInWithGitHub} className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-3.5 text-sm font-semibold text-ink transition hover:border-[#7056d8] hover:text-[#7056d8] disabled:cursor-wait disabled:opacity-70 dark:border-white/15 dark:bg-[#201b35] dark:text-white"><Github size={18}/>{isSigningInWithGitHub ? t("Omdirigerar...", "Redirecting...") : t("Fortsätt med GitHub", "Continue with GitHub")}</button></>}
      {process.env.NODE_ENV !== "production" && <button type="button" onClick={handleMockLogin} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/15 dark:text-white"><FlaskConical size={18}/>{t("Fortsätt i demo-läge", "Continue in demo mode")}</button>}
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
