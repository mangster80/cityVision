"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Github, Heart, Mail, MessageCircle, Pencil, ShieldCheck, ThumbsUp } from "lucide-react";
import { ProposalGrid } from "@/components/ui";
import { useProposals } from "@/services/place-service";
import { users } from "@/data/mock-data";
import { getStoredUser, isDemoLoginEnabled, setStoredUser, updateStoredUser } from "@/services/user-storage";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/components/toast-provider";
import { useUnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import { supabase } from "@/services/supabase";
import { syncSupabaseProfile, updateSupabaseProfile } from "@/services/profile-service";
import { Proposal } from "@/types";
import { listSupportedProposalIds } from "@/services/proposal-support-service";
import { proposalChangeEventName } from "@/services/proposal-interactions";

function ProfileContent() {
  const [tab, setTab] = useState<"ideas" | "supported">("ideas");
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast(t("Bilden får vara högst 5 MB.", "The image must be 5 MB or smaller."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
        setIsDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { proposals } = useProposals();
  const [supportedProposalIds, setSupportedProposalIds] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  useEffect(() => {
    const syncUser = async () => {
      const storedUser = getStoredUser();
      if (!supabase) {
        setIsVerified(false);
        if (!storedUser && process.env.NODE_ENV !== "production" && isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setUser(demoUser);
          setHydrated(true);
          return;
        }
        setUser(storedUser);
        setHydrated(true);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setIsVerified(false);
        if (!storedUser && process.env.NODE_ENV !== "production" && isDemoLoginEnabled()) {
          const demoUser = users[0];
          setStoredUser(demoUser);
          setUser(demoUser);
          setHydrated(true);
          return;
        }
        setUser(storedUser);
        setHydrated(true);
        return;
      }
      setIsVerified(Boolean(data.user.email_confirmed_at || data.user.app_metadata?.provider === "github"));
      if (!storedUser) {
        try {
          const sessionUser = await syncSupabaseProfile(users[0]);
          setStoredUser(sessionUser);
          setUser(sessionUser);
        } catch {
          setUser(null);
        }
        setHydrated(true);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("id, name, avatar_url, bio, city, neighborhood, role, provider, provider_email, auth_email").eq("id", data.user.id).maybeSingle();
      setUser(profile ? {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar_url || storedUser.avatar,
        bio: profile.bio || undefined,
        city: profile.city || undefined,
        neighborhood: profile.neighborhood || undefined,
        role: profile.role || undefined,
        provider: profile.provider || undefined,
        providerEmail: profile.provider_email || undefined,
        authEmail: profile.auth_email || undefined,
      } : storedUser);
      setHydrated(true);
    };
    void syncUser();
    const handleAuthChange = () => { void syncUser(); };
    window.addEventListener("cityvision-auth-change", handleAuthChange);
    return () => window.removeEventListener("cityvision-auth-change", handleAuthChange);
  }, []);
  useEffect(() => {
    if (!user) {
      setSupportedProposalIds(new Set());
      return;
    }
    const loadSupports = () => {
      void listSupportedProposalIds(user.id)
        .then(setSupportedProposalIds)
        .catch(() => setSupportedProposalIds(new Set()));
    };
    loadSupports();
    window.addEventListener(proposalChangeEventName(), loadSupports);
    return () => window.removeEventListener(proposalChangeEventName(), loadSupports);
  }, [user]);
  const requestedUserId = searchParams.get("user")?.trim() || null;
  const profileUser = requestedUserId ? users.find(candidate => candidate.id === requestedUserId) ?? null : user;
  const isOwnProfile = !searchParams.get("user") || profileUser?.id === user?.id;
  const authProvider = profileUser?.provider ?? "email";
  const authEmail = profileUser?.providerEmail ?? profileUser?.authEmail ?? "";
  const authLabel = authProvider === "github" ? "GitHub" : authProvider === "email" ? "Email" : authProvider;
  const authIcon = authProvider === "github" ? <Github size={14} className="shrink-0" /> : authProvider === "email" ? <Mail size={14} className="shrink-0" /> : <ShieldCheck size={14} className="shrink-0" />;
  const { requestDiscard, dialog } = useUnsavedChangesGuard(editing && isOwnProfile && isDirty);
  useEffect(() => {
    if (profileUser && (!editing || !isOwnProfile)) setNameDraft(profileUser.name);
  }, [editing, isOwnProfile, profileUser]);
  if (!hydrated) return <main className="min-h-screen px-5 pb-20 pt-32 sm:px-10" aria-hidden="true" />;
  if (!profileUser) return <main className="grid min-h-screen place-items-center px-5 pt-32"><div className="text-center"><p className="text-slate-500">{t("Profilen kunde inte hittas.", "Profile not found.")}</p><Link href="/explore" className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">{t("Till Explore", "Go to Explore")}</Link></div></main>;
  const ownProposals = proposals.filter(proposal => proposal.author.id === profileUser.id);
  const supportedProposals: Proposal[] = proposals.filter(proposal => supportedProposalIds.has(proposal.id));
  const visibleProposals = tab === "ideas" ? ownProposals : supportedProposals;
  const persistProfile = async (details: { name: string; avatar: string; bio: string; city: string; neighborhood: string; role: string }) => {
    if (!supabase) return false;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("No authenticated Supabase user found.");
      await updateSupabaseProfile(authData.user.id, details);
      return true;
    } catch {
      showToast(t("Profilen kunde inte sparas i databasen.", "The profile could not be saved to the database."));
      return false;
    }
  };

  return <main className="px-5 pb-20 pt-28 sm:px-8 sm:pt-32"><div className="mx-auto max-w-6xl">
    <Link href={isOwnProfile ? "/" : "/explore"} className="mb-6 inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-white/70 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"><ArrowLeft size={16}/> {isOwnProfile ? "Till startsidan" : "Till Explore"}</Link>
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_18px_55px_rgba(72,44,133,.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#201b35]/90">
      <div className="brand-gradient relative h-36 overflow-hidden sm:h-48"><div className="hero-grid absolute inset-0 opacity-30"/><div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[28px] border-white/15"/><div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl"/></div>
      <div className="relative px-6 pb-7 sm:px-10 sm:pb-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-12 flex min-w-0 items-end gap-4 sm:-mt-16">
            <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">{editing && isOwnProfile ? <label htmlFor="profile-avatar-file" className="group block h-full w-full cursor-pointer rounded-full"><span className="grid h-full w-full place-items-center overflow-hidden rounded-full border-4 border-white bg-mint p-1 shadow-[0_10px_30px_rgba(23,19,38,.24)] dark:border-[#201b35] dark:bg-[#292044]"><Image src={avatarPreview || profileUser.avatar} alt={`Profilbild för ${nameDraft}`} width={320} height={320} className="h-full w-full rounded-full object-cover transition group-hover:brightness-75"/></span><span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-ink text-white shadow-md dark:border-[#201b35]"><Pencil size={14}/></span></label> : <span className="grid h-full w-full place-items-center overflow-hidden rounded-full border-4 border-white bg-mint p-1 shadow-[0_10px_30px_rgba(23,19,38,.24)] dark:border-[#201b35] dark:bg-[#292044]"><Image src={profileUser.avatar} alt={`Profilbild för ${profileUser.name}`} width={320} height={320} className="h-full w-full rounded-full object-cover"/></span>}</div>
            <div className="min-w-0 pb-1">
              <span className="inline-flex rounded-full border border-sage/30 bg-mint px-3 py-1 text-[10px] font-bold tracking-[.14em] text-sage dark:bg-[#292044]">STADSLYFT-MEDLEM</span>
              <div className="mt-2 flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{editing && isOwnProfile ? nameDraft : profileUser.name}</h1>{isVerified && <span title={t("Verifierad profil", "Verified profile")} aria-label={t("Verifierad profil", "Verified profile")} className="inline-flex items-center justify-center text-sage"><ShieldCheck size={19} strokeWidth={2.4}/></span>}{authEmail && <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-[#292044] dark:text-slate-200"><span className="inline-flex items-center justify-center">{authIcon}</span>{authLabel}</span>}</div>
              <p className="mt-1 truncate text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">{[profileUser.city || "Stockholm", profileUser.neighborhood].filter(Boolean).join(" · ")} · med sedan september 2024</p>
            </div>
          </div>
          <div className="sm:pb-1">{isOwnProfile ? <button onClick={() => { if (editing) { requestDiscard(() => { setAvatarPreview(""); setIsDirty(false); setEditing(false); }); return; } setIsDirty(false); setEditing(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 hover:bg-[#7056d8] sm:w-auto"><Pencil size={15}/> {t("Redigera profil", "Edit profile")}</button> : <span aria-hidden="true" className="block h-11" />}</div>
        </div>
      </div>
    </section>
    {(profileUser.bio || profileUser.role || authEmail) && <section className="mt-5 rounded-3xl border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-xl sm:p-7 dark:border-white/10 dark:bg-[#201b35]/85"><div className="grid gap-6 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-sage">{t("OM MIG", "ABOUT ME")}</p><p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-300">{profileUser.bio || t("Ingen presentation ännu.", "No introduction yet.")}</p></div>{profileUser.role && <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-sage">{t("ROLL", "ROLE")}</p><p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">{profileUser.role}</p></div>}{profileUser.city && <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-sage">{t("PLATS", "LOCATION")}</p><p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">{profileUser.city}{profileUser.neighborhood ? ` · ${profileUser.neighborhood}` : ""}</p></div>}{authEmail && <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-sage">{t("AUTENTISERAD VIA", "AUTHENTICATED VIA")}</p><p className="flex items-center gap-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-300"><span className="inline-flex items-center justify-center">{authIcon}</span>{authLabel}</p><p className="mt-1 break-all text-xs text-slate-400 dark:text-slate-400">{authEmail}</p></div>}</div></section>}
    {editing && isOwnProfile && <form onChange={() => setIsDirty(true)} onSubmit={async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("name") || "").trim(); const avatar = avatarPreview || profileUser.avatar; if (!name) return; const details = { name, avatar, bio: String(form.get("bio") || "").trim(), city: String(form.get("city") || "").trim(), neighborhood: String(form.get("neighborhood") || "").trim(), role: String(form.get("role") || "").trim() }; if (!await persistProfile(details)) return; updateStoredUser(details); setUser(current => current ? { ...current, ...details } : current); setAvatarPreview(""); setIsDirty(false); setEditing(false); window.dispatchEvent(new Event("cityvision-auth-change")); showToast(t("Profilen är uppdaterad", "Profile updated")); }} className="mt-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#201b35]"><input id="profile-avatar-file" name="avatarFile" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleAvatarChange}/><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">{t("Namn", "Name")}<input name="name" value={nameDraft} onChange={event => setNameDraft(event.target.value)} required className="field mt-2"/></label><label className="text-sm font-semibold sm:col-span-2">{t("Kort bio", "Short bio")}<textarea name="bio" defaultValue={profileUser.bio || ""} rows={3} maxLength={240} className="field mt-2 resize-none" placeholder={t("Berätta kort om dig själv...", "Tell people a little about yourself...")} /></label><label className="text-sm font-semibold">{t("Ort", "City")}<input name="city" defaultValue={profileUser.city || ""} className="field mt-2" /></label><label className="text-sm font-semibold">{t("Stadsdel", "Neighborhood")}<input name="neighborhood" defaultValue={profileUser.neighborhood || ""} className="field mt-2" /></label><label className="text-sm font-semibold sm:col-span-2">{t("Yrke eller roll", "Profession or role")}<input name="role" defaultValue={profileUser.role || ""} className="field mt-2" placeholder={t("Till exempel lokal konstnär eller stadsplanerare", "For example local artist or city planner")} /></label></div><div className="mt-5 flex justify-end gap-3">    <button type="button" onClick={() => requestDiscard(() => { setAvatarPreview(""); setIsDirty(false); setEditing(false); })} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/15">{t("Avbryt", "Cancel")}</button><button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">{t("Spara ändringar", "Save changes")}</button></div></form>}
    {dialog}
    <div className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-mint p-4 dark:bg-[#292044]"><Heart className="mb-3 text-sage" size={19}/><p className="text-2xl font-semibold">{ownProposals.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">{t("förslag skapade", "proposals created")}</p></div><div className="rounded-2xl bg-mint p-4 dark:bg-[#292044]"><ThumbsUp className="mb-3 text-sage" size={19}/><p className="text-2xl font-semibold">{ownProposals.reduce((total, proposal) => total + proposal.votes, 0).toLocaleString("sv-SE")}</p><p className="text-xs text-slate-500 dark:text-slate-400">{t("röster fått", "votes received")}</p></div><div className="rounded-2xl bg-mint p-4 dark:bg-[#292044]"><Heart className="mb-3 text-sage" size={19}/><p className="text-2xl font-semibold">{supportedProposals.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">{t("idéer stöttade", "ideas supported")}</p></div><div className="rounded-2xl bg-mint p-4 dark:bg-[#292044]"><MessageCircle className="mb-3 text-sage" size={19}/><p className="text-2xl font-semibold">{ownProposals.reduce((total, proposal) => total + proposal.comments, 0)}</p><p className="text-xs text-slate-500 dark:text-slate-400">{t("kommentarer", "comments")}</p></div></div>
    <div className="mb-7 flex gap-2 border-b border-black/10 dark:border-white/10"><button onClick={() => setTab("ideas")} className={`border-b-2 px-2 pb-3 text-sm font-semibold ${tab === "ideas" ? "border-sage text-ink dark:text-white" : "border-transparent text-slate-400"}`}>Mina idéer ({ownProposals.length})</button><button onClick={() => setTab("supported")} className={`border-b-2 px-2 pb-3 text-sm font-semibold ${tab === "supported" ? "border-sage text-ink dark:text-white" : "border-transparent text-slate-400"}`}>Stöttade förslag ({supportedProposals.length})</button></div>
    <ProposalGrid proposals={visibleProposals} compact />
  </div></main>;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-5 pb-20 pt-32 sm:px-10" aria-hidden="true" />}>
      <ProfileContent />
    </Suspense>
  );
}
