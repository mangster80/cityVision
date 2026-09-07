"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div role="status" aria-live="polite" className="toast-enter fixed left-1/2 top-24 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/70 bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur sm:top-28">
          <CheckCircle2 size={18} className="text-[#9ce6c0]" />
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast måste användas inuti ToastProvider");
  return context;
}
