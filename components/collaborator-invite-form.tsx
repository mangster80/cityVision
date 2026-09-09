"use client";

import { FormEvent, useState } from "react";

export function CollaboratorInviteForm({ proposalId }: { proposalId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
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
    <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="E-post till samarbetspartner" className="field min-w-56 flex-1"/>
    <button disabled={sending} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:opacity-60">{sending ? "Skickar..." : "Bjud in"}</button>
    {status && <p role="status" className="basis-full text-xs text-slate-500">{status}</p>}
  </form>;
}
