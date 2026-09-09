"use client";

import Link from "next/link";
import { use, useState } from "react";

export default function CollaboratorInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [message, setMessage] = useState("Klicka för att acceptera inbjudan.");
  const [loading, setLoading] = useState(false);

  const acceptInvite = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collaborator-invites/${token}/accept`, { method: "POST" });
      const result = await response.json() as { error?: string; proposalId?: string };
      if (!response.ok) throw new Error(result.error ?? "Inbjudan kunde inte accepteras.");
      setMessage("Inbjudan accepterad.");
      if (result.proposalId) window.location.assign(`/proposal/${result.proposalId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Inbjudan kunde inte accepteras.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center px-5 pt-20"><div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-xl"><h1 className="text-3xl font-semibold">Samarbetsinbjudan</h1><p className="mt-3 text-slate-500">{message}</p><button onClick={() => { void acceptInvite(); }} disabled={loading} className="mt-8 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:opacity-60">{loading ? "Bearbetar..." : "Acceptera inbjudan"}</button><Link href="/login" className="mt-4 block text-sm text-slate-500 hover:text-ink">Logga in</Link></div></main>;
}
