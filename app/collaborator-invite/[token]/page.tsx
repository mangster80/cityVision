"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export default function CollaboratorInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const acceptInvite = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collaborator-invites/${token}/accept`, { method: "POST" });
      const result = await response.json() as { error?: string; proposalId?: string };
      if (!response.ok) throw new Error(result.error ?? t("collaborator-invite.accept-error"));
      setMessage(t("collaborator-invite.accepted"));
      if (result.proposalId) window.location.assign(`/proposal/${result.proposalId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("collaborator-invite.accept-error"));
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center px-5 pt-20"><div className="w-full max-w-md rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-xl"><h1 className="text-3xl font-semibold">{t("collaborator-invite.title")}</h1><p className="mt-3 text-slate-500">{message || t("collaborator-invite.prompt")}</p><button onClick={() => { void acceptInvite(); }} disabled={loading} className="mt-8 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7056d8] disabled:opacity-60">{loading ? t("collaborator-invite.processing") : t("collaborator-invite.accept")}</button><Link href="/login" className="mt-4 block text-sm text-slate-500 hover:text-ink">{t("collaborator-invite.login")}</Link></div></main>;
}
