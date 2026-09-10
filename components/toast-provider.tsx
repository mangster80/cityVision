"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  showToast: (message: string, options?: { persistent?: boolean; variant?: "success" | "error" }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(false);
  const [variant, setVariant] = useState<"success" | "error">("success");
  const [isClosing, setIsClosing] = useState(false);

  const showToast = useCallback((nextMessage: string, options?: { persistent?: boolean; variant?: "success" | "error" }) => {
    setIsClosing(false);
    setPersistent(options?.persistent ?? false);
    setVariant(options?.variant ?? "success");
    setMessage(nextMessage);
  }, []);

  const dismissToast = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => setMessage(null), 220);
  }, []);

  useEffect(() => {
    if (!message || persistent) return;
    const timeout = window.setTimeout(dismissToast, 3500);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, message, persistent]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <button type="button" role={variant === "error" ? "alert" : "status"} aria-live={variant === "error" ? "assertive" : "polite"} onClick={dismissToast} className={`${isClosing ? "toast-exit" : "toast-enter"} fixed left-1/2 top-24 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur sm:top-28 sm:gap-3 sm:px-5 sm:py-3.5 ${variant === "error" ? "border-red-200 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-[#3a1d2b] dark:text-red-100" : "border-white/70 bg-ink text-white"}`}>
          {variant === "error" ? <AlertCircle aria-hidden="true" size={18} strokeWidth={2.25} className="shrink-0 text-red-600 dark:text-red-300" /> : <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.25} className="shrink-0 text-[#9ce6c0]" />}
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{message}</span>
        </button>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast måste användas inuti ToastProvider");
  return context;
}
