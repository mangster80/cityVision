"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/services/supabase";
import { users } from "@/data/mock-data";
import { setStoredUser } from "@/services/user-storage";
import { syncSupabaseProfile } from "@/services/profile-service";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const completeLogin = async () => {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token-hash");
      const verificationType = searchParams.get("type");
      const next = searchParams.get("next");
      const requestedPath = next?.split("#")[0];
      const redirectPath = requestedPath?.startsWith("/") ? requestedPath : "/explore";
      if (!supabase) {
        router.replace("/login?error=auth_callback");
        return;
      }
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && verificationType === "magiclink"
          ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" })
          : tokenHash && verificationType === "email"
            ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
            : await supabase.auth.getSession().then(({ data, error: sessionError }) => ({ error: sessionError ?? (!data.session ? new Error("Ingen aktiv session hittades. Begär en ny magic link.") : null) }));
      if (!error) {
        try {
          setStoredUser(await syncSupabaseProfile(users[0]));
        } catch (profileError) {
          router.replace(`/login?error=${encodeURIComponent(profileError instanceof Error ? profileError.message : "profile_create_failed")}`);
          return;
        }
        window.dispatchEvent(new Event("cityvision-auth-change"));
      }
      router.replace(error ? `/login?error=${encodeURIComponent(error.message)}` : redirectPath);
    };
    void completeLogin();
  }, [router, searchParams]);

  return <main className="grid min-h-screen place-items-center px-5 pt-20"><p className="text-sm text-slate-500">Slutför inloggning...</p></main>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center px-5 pt-20"><p className="text-sm text-slate-500">Slutför inloggning...</p></main>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
