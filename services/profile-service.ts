import { User } from "@/types";
import { supabase } from "@/services/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function createAuthFallbackProfile(user: Pick<SupabaseUser, "id" | "email" | "user_metadata">): User {
  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" && metadata.full_name.trim()
    ? metadata.full_name.trim()
    : typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : user.email?.split("@")[0] || "Stadslyft medlem";
  const avatar = typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()
    ? metadata.avatar_url.trim()
    : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=320&h=320&q=85";
  return { id: user.id, name, avatar };
}

function resolveAuthProfileData(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; email?: string | null }, fallback: User) {
  const metadata = user.user_metadata ?? {} as Record<string, unknown>;
  const appMetadata = user.app_metadata ?? {} as Record<string, unknown>;
  const provider = typeof appMetadata.provider === "string" ? appMetadata.provider : typeof metadata.provider === "string" ? metadata.provider : "email";
  const providerEmail = typeof metadata.email === "string" && metadata.email.trim() ? metadata.email.trim() : (typeof user.email === "string" ? user.email.trim() : undefined);
  const authEmail = typeof user.email === "string" && user.email.trim() ? user.email.trim() : providerEmail;
  const name = typeof metadata.full_name === "string" && metadata.full_name.trim()
    ? metadata.full_name.trim()
    : typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : typeof metadata.user_name === "string" && metadata.user_name.trim()
        ? metadata.user_name.trim()
        : fallback.name;
  const avatar = typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()
    ? metadata.avatar_url.trim()
    : fallback.avatar;

  return { name, avatar, provider, providerEmail, authEmail };
}

export async function syncSupabaseProfile(fallback: User, authenticatedUser?: SupabaseUser): Promise<User> {
  if (!supabase) return fallback;
  const authUser = authenticatedUser ?? (await supabase.auth.getUser()).data.user;
  if (!authUser) return fallback;

  const authProfile = resolveAuthProfileData(authUser, fallback);

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, bio, city, neighborhood, role, provider, provider_email, auth_email, last_sign_in_at, last_seen_at")
    .eq("id", authUser.id)
    .maybeSingle();
  if (readError) throw readError;

  const profileUpdate = {
    name: authProfile.name,
    avatar_url: authProfile.avatar,
    provider: authProfile.provider,
    provider_email: authProfile.providerEmail ?? null,
    auth_email: authProfile.authEmail ?? null,
    last_sign_in_at: authUser.last_sign_in_at ?? null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingProfile) {
    const shouldRefresh = existingProfile.name !== authProfile.name || (existingProfile.avatar_url ?? "") !== authProfile.avatar || (existingProfile.provider ?? "") !== authProfile.provider || (existingProfile.provider_email ?? "") !== (authProfile.providerEmail ?? "") || (existingProfile.auth_email ?? "") !== (authProfile.authEmail ?? "");
    if (shouldRefresh) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", authUser.id);
      if (updateError) throw updateError;
    }
    return {
      id: existingProfile.id,
      name: existingProfile.name === authProfile.name ? existingProfile.name : authProfile.name,
      avatar: (existingProfile.avatar_url || authProfile.avatar) === authProfile.avatar ? authProfile.avatar : existingProfile.avatar_url || authProfile.avatar,
      bio: existingProfile.bio || undefined,
      city: existingProfile.city || undefined,
      neighborhood: existingProfile.neighborhood || undefined,
      role: existingProfile.role || undefined,
      provider: existingProfile.provider || authProfile.provider,
      providerEmail: existingProfile.provider_email || authProfile.providerEmail,
      authEmail: existingProfile.auth_email || authProfile.authEmail,
    };
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: authUser.id,
      name: authProfile.name,
      avatar_url: authProfile.avatar,
      provider: authProfile.provider,
      provider_email: authProfile.providerEmail ?? null,
      auth_email: authProfile.authEmail ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      last_seen_at: new Date().toISOString(),
    })
    .select("id, name, avatar_url, bio, city, neighborhood, role, provider, provider_email, auth_email, last_sign_in_at, last_seen_at")
    .single();
  if (insertError) throw insertError;
  if (!createdProfile) throw new Error("Supabase returned no profile after insert.");
  const profile = createdProfile;
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url || authProfile.avatar,
    bio: profile.bio || undefined,
    city: profile.city || undefined,
    neighborhood: profile.neighborhood || undefined,
    role: profile.role || undefined,
    provider: profile.provider || authProfile.provider,
    providerEmail: profile.provider_email || authProfile.providerEmail,
    authEmail: profile.auth_email || authProfile.authEmail,
  };
}

export async function updateSupabaseProfile(userId: string, updates: Partial<User>) {
  if (!supabase) return;

  const payload: Record<string, string | null> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
  if (updates.bio !== undefined) payload.bio = updates.bio || null;
  if (updates.city !== undefined) payload.city = updates.city || null;
  if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood || null;
  if (updates.role !== undefined) payload.role = updates.role || null;
  if (updates.provider !== undefined) payload.provider = updates.provider || null;
  if (updates.providerEmail !== undefined) payload.provider_email = updates.providerEmail || null;
  if (updates.authEmail !== undefined) payload.auth_email = updates.authEmail || null;

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  if (error) throw error;
}

export async function updateSupabasePresence(userId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}
