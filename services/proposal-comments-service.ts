"use client";

import { Comment, User } from "@/types";
import { getStoredUser, isDemoLoginEnabled } from "@/services/user-storage";
import { supabase } from "@/services/supabase";

const demoCommentsStorageKey = "cityvision-demo-proposal-comments";

interface CommentRow {
  id: string;
  proposal_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { id: string; name: string; avatar_url: string | null }[] | null;
}

function toComment(row: CommentRow): Comment {
  const profile = row.profiles?.[0];
  const user: User = profile
    ? { id: profile.id, name: profile.name, avatar: profile.avatar_url ?? "" }
    : { id: row.user_id, name: "Stadslyft member", avatar: "" };
  return { id: row.id, proposalId: row.proposal_id, user, body: row.body, createdAt: row.created_at };
}

function getDemoComments(): Comment[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(demoCommentsStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const storedUser = getStoredUser();
    return (parsed as Comment[]).map(comment => comment.user.id === "demo-user" && storedUser
      ? { ...comment, user: storedUser }
      : comment);
  } catch {
    return [];
  }
}

function setDemoComments(comments: Comment[]) {
  window.localStorage.setItem(demoCommentsStorageKey, JSON.stringify(comments));
}

export async function listProposalComments(proposalId: string) {
  if (!supabase) return getDemoComments().filter(comment => comment.proposalId === proposalId);
  const { data, error } = await supabase
    .from("comments")
    .select("id, proposal_id, user_id, body, created_at, profiles(id, name, avatar_url)")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const comments = (data as CommentRow[] | null ?? []).map(toComment);
  return [...comments, ...getDemoComments().filter(comment => comment.proposalId === proposalId)];
}

export async function createProposalComment(proposalId: string, body: string): Promise<Comment> {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error("Kommentaren får inte vara tom.");
  if (isDemoLoginEnabled()) {
    const storedUser = getStoredUser();
    const comment: Comment = {
      id: `demo-${crypto.randomUUID()}`,
      proposalId,
      user: storedUser ?? { id: "demo-user", name: "Du", avatar: "" },
      body: trimmedBody,
      createdAt: new Date().toISOString()
    };
    setDemoComments([...getDemoComments(), comment]);
    return comment;
  }
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Du måste vara inloggad för att kommentera.");
  const { data, error } = await supabase
    .from("comments")
    .insert({ proposal_id: proposalId, user_id: authData.user.id, body: trimmedBody })
    .select("id, proposal_id, user_id, body, created_at, profiles(id, name, avatar_url)")
    .single();
  if (error) throw error;
  return toComment(data as CommentRow);
}
