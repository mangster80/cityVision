"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Github,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { useLanguage } from "@/components/language-provider";
import { users } from "@/data/mock-data";
import { setDemoLoginEnabled, setStoredUser } from "@/services/user-storage";

function getRateLimitSeconds(message: string) {
  const waitMatch =
    message.match(/after\s+(\d+)\s+seconds?/i) ??
    message.match(/\b(\d+)\s+seconds?\b/i);
  const waitSeconds = waitMatch?.[1];
  return waitSeconds ? Number(waitSeconds) : null;
}

function getRateLimitMessage(
  seconds: number | null,
  translate: (key: string) => string,
) {
  if (seconds === null || seconds <= 0) return "";
  return translate("login.retry-in-seconds").replace("{seconds}", String(seconds));
}

function getRateLimitSummary(
  translate: (key: string) => string,
) {
  return translate("login.too-many-attempts");
}

function translateAuthError(
  message: string,
  translate: (key: string) => string,
) {
  const normalized = decodeURIComponent(message).toLowerCase();
  if (
    normalized.includes("invalid email") ||
    normalized.includes("email address is invalid")
  )
    return translate("login.enter-a-valid-email-address");
  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("over_email_send_rate_limit")
  )
    return translate("login.too-many-email-requests");
  if (normalized.includes("invalid login credentials"))
    return translate("login.invalid-credentials");
  if (normalized.includes("user already registered"))
    return translate("login.user-already-registered");
  if (normalized.includes("email not confirmed"))
    return translate("login.email-not-confirmed");
  if (
    normalized.includes("signup is disabled") ||
    normalized.includes("signups not allowed")
  )
    return translate("login.signup-disabled");
  if (normalized.includes("provider is disabled"))
    return translate("login.provider-disabled");
  if (normalized.includes("redirect") && normalized.includes("not allowed"))
    return translate("login.redirect-not-allowed");
  if (normalized.includes("pkce code verifier not found"))
    return translate("login.pkce-verifier-not-found");
  if (
    normalized.includes("expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("otp")
  )
    return translate("login.expired-link");
  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("for security purposes")
  ) {
    const waitSeconds = getRateLimitSeconds(message);
    return waitSeconds
      ? getRateLimitMessage(waitSeconds, translate)
      : getRateLimitSummary(translate);
  }
  if (normalized === "auth_callback")
    return translate("login.auth-callback-error");
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

    const waitSeconds = getRateLimitSeconds(callbackError);
    setErrorSource(callbackError);
    setRateLimitSeconds(waitSeconds);
    setError(
      waitSeconds
        ? getRateLimitSummary(t)
        : translateAuthError(callbackError, t),
    );
  }, [searchParams, t]);

  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRateLimitSeconds((current) => {
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
    if (rateLimitSeconds === null) return;
    if (rateLimitSeconds > 0 && errorSource) {
      setError(getRateLimitSummary(t));
      return;
    }
    setError("");
    setErrorSource(null);
  }, [errorSource, rateLimitSeconds, t]);

  const redirectPath = searchParams.get("redirect")?.startsWith("/")
    ? searchParams.get("redirect")!
    : "/explore";
  const isRetryLocked = rateLimitSeconds !== null && rateLimitSeconds > 0;

  const handleMagicLink = async () => {
    if (isRetryLocked || isSending) return;
    setError("");
    setErrorSource(null);
    setRateLimitSeconds(null);
    if (!isValidEmail(email)) {
      setError(t("login.enter-a-valid-email-address"));
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch("/auth/magic-link/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), next: redirectPath }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "auth_request_failed";
        const waitSeconds = getRateLimitSeconds(message);
        setErrorSource(message);
        setRateLimitSeconds(waitSeconds);
        setError(
          waitSeconds
            ? getRateLimitMessage(waitSeconds, t)
            : translateAuthError(message, t),
        );
        return;
      }
      setSent(true);
      showToast(t("login.magic-link-sent"));
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "auth_request_failed";
      const waitSeconds = getRateLimitSeconds(message);
      setErrorSource(message);
      setRateLimitSeconds(waitSeconds);
      setError(
        waitSeconds
          ? getRateLimitMessage(waitSeconds, t)
          : translateAuthError(message, t),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError("");
    setIsSigningInWithGitHub(true);
    window.location.assign(
      `/auth/oauth/start?next=${encodeURIComponent(redirectPath)}`,
    );
  };

  const handleMockLogin = () => {
    setDemoLoginEnabled(true);
    setStoredUser(users[0]);
    window.dispatchEvent(new Event("cityvision-auth-change"));
    window.dispatchEvent(new Event("cityvision-auth-login"));
    router.replace(redirectPath);
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 pt-16">
      <div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 shadow-xl sm:p-10">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400"
        >
          <ArrowLeft size={15} /> {t("login.back-home")}
        </Link>
        <div className="mb-8">
          <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white">
            <LockKeyhole size={21} />
          </div>
          <h1 className="text-3xl font-semibold">{t("login.log-in")}</h1>
          <p className="mt-2 text-slate-500">
            {t(
              "login.sign-in-securely-without-a-password-using-a-magic-link-sent-",
            )}
          </p>
        </div>
        {sent ? (
          <div className="rounded-2xl bg-mint p-5 text-center text-sm text-sage">
            {t("login.check-your-inbox-and-click-the-link-to-sign-in")}
          </div>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleMagicLink();
              }}
              className="space-y-4"
            >
              <input
                id="email"
                name="email"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                placeholder={t("login.your-email-address")}
                title={t("login.enter-a-valid-email-address")}
                onInvalid={(event) => {
                  event.preventDefault();
                  setError(t("login.enter-a-valid-email-address"));
                }}
                className="field"
              />
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSending || isRetryLocked}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:cursor-wait disabled:opacity-70"
              >
                <Mail size={18} />
                {isSending
                  ? t("login.sending")
                  : isRetryLocked
                    ? t("login.retry-button").replace(
                        "{seconds}",
                        String(rateLimitSeconds),
                      )
                    : t("login.use-magic-link")}
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-black/10 after:h-px after:flex-1 after:bg-black/10">
              {t("login.or")}
            </div>
            <button
              type="button"
              onClick={() => {
                void handleGitHubLogin();
              }}
              disabled={isSigningInWithGitHub}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-3.5 text-sm font-semibold text-ink transition hover:border-[#7056d8] hover:text-[#7056d8] disabled:cursor-wait disabled:opacity-70 dark:border-white/15 dark:bg-[#201b35] dark:text-white"
            >
              <Github size={18} />
              {isSigningInWithGitHub
                ? t("login.redirecting")
                : t("login.continue-with-github")}
            </button>
          </>
        )}
        {process.env.NODE_ENV !== "production" && (
          <button
            type="button"
            onClick={handleMockLogin}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-ink dark:border-white/15 dark:text-white"
          >
            <FlaskConical size={18} />
            {t("login.continue-in-demo-mode")}
          </button>
        )}
      </div>
    </main>
  );
}

function LoginFallback() {
  const { t } = useLanguage();
  return (
    <main className="grid min-h-screen place-items-center px-5 pt-16">
      <p className="text-sm text-slate-500">{t("common.loading")}</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<LoginFallback />}
    >
      <LoginContent />
    </Suspense>
  );
}
