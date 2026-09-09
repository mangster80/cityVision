"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  showToast: (message: string, options?: { persistent?: boolean }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const showToast = useCallback((nextMessage: string, options?: { persistent?: boolean }) => {
    setIsClosing(false);
    setPersistent(options?.persistent ?? false);
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
        <button type="button" role="status" aria-live="polite" onClick={dismissToast} className={`${isClosing ? "toast-exit" : "toast-enter"} fixed left-1/2 top-24 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/70 bg-ink px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur sm:top-28 sm:gap-3 sm:px-5 sm:py-3.5`}>
          <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.25} className="shrink-0 text-[#9ce6c0]" />
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
