"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function CollaboratorInviteForm({ proposalId, demoMode = false }: { proposalId: string; demoMode?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      if (demoMode) {
        window.localStorage.setItem(`cityvision-demo-collaborator-invite:${proposalId}`, email.trim().toLowerCase());
        setEmail("");
        setStatus("Demo-inbjudan sparad lokalt.");
        return;
      }
      const response = await fetch(`/api/proposals/${proposalId}/collaborators/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Inbjudan kunde inte skickas.");
      setEmail("");
      setStatus("Inbjudan skickad.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Inbjudan kunde inte skickas.");
    } finally {
      setSending(false);
    }
  };

  return <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap gap-2">
    <label htmlFor={`collaborator-email-${proposalId}`} className="sr-only">E-post till samarbetspartner</label>
    <input
      id={`collaborator-email-${proposalId}`}
      name="collaboratorEmail"
      required
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      value={email}
      onChange={event => {
        event.currentTarget.setCustomValidity("");
        setEmail(event.target.value);
      }}
      placeholder="E-post till samarbetspartner"
      title={t("login.enter-a-valid-email-address")}
      onInvalid={event => {
        event.currentTarget.setCustomValidity(t("login.enter-a-valid-email-address"));
      }}
      className="field min-w-56 flex-1"
    />
    <button disabled={sending} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:opacity-60">{sending ? "Skickar..." : "Bjud in"}</button>
    {status && <p role="status" className="basis-full text-xs text-slate-500">{status}</p>}
  </form>;
}
