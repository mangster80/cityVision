"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";
import { clearStoredUser, getStoredUser, isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";

const idleTimeoutMs = 10 * 60 * 1000;
const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;

export function IdleLogout() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const timeoutRef = useRef<number | null>(null);
  const authenticatedRef = useRef(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };

    const logoutForInactivity = async () => {
      clearTimer();
      if (!authenticatedRef.current) return;
      authenticatedRef.current = false;
      if (supabase && !isDemoLoginEnabled()) await supabase.auth.signOut();
      clearStoredUser();
      window.dispatchEvent(new Event("cityvision-auth-change"));
      showToast(t("header.logged-out-for-inactivity"));
      router.push("/explore");
    };

    const scheduleLogout = () => {
      clearTimer();
      if (!authenticatedRef.current) return;
      timeoutRef.current = window.setTimeout(() => { void logoutForInactivity(); }, idleTimeoutMs);
    };

    const syncAuthentication = async () => {
      authenticatedRef.current = Boolean(getStoredUser()) || isDemoLoginEnabled();
      if (!authenticatedRef.current && supabase) {
        const { data } = await supabase.auth.getUser();
        authenticatedRef.current = Boolean(data.user);
      }
      scheduleLogout();
    };

    const handleActivity = () => scheduleLogout();
    void syncAuthentication();
    for (const eventName of activityEvents) window.addEventListener(eventName, handleActivity, { passive: true });
    const handleAuthChange = () => { void syncAuthentication(); };
    window.addEventListener("cityvision-auth-change", handleAuthChange);
    return () => {
      clearTimer();
      for (const eventName of activityEvents) window.removeEventListener(eventName, handleActivity);
      window.removeEventListener("cityvision-auth-change", handleAuthChange);
    };
  }, [router, showToast, t]);

  return null;
}
