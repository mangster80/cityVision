import { User } from "@/types";
import { supabase } from "@/services/supabase";

export async function syncSupabaseProfile(fallback: User): Promise<User> {
  if (!supabase) return fallback;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return fallback;

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, bio, city, neighborhood, role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existingProfile) {
    return {
      id: existingProfile.id,
      name: existingProfile.name,
      avatar: existingProfile.avatar_url || fallback.avatar,
      bio: existingProfile.bio || undefined,
      city: existingProfile.city || undefined,
      neighborhood: existingProfile.neighborhood || undefined,
      role: existingProfile.role || undefined,
    };
  }
  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: authData.user.id, name: fallback.name, avatar_url: fallback.avatar })
    .select("id, name, avatar_url, bio, city, neighborhood, role")
    .single();
  if (insertError) throw insertError;
  if (!createdProfile) throw new Error("Supabase returned no profile after insert.");
  const profile = createdProfile;
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url || fallback.avatar,
    bio: profile.bio || undefined,
    city: profile.city || undefined,
    neighborhood: profile.neighborhood || undefined,
    role: profile.role || undefined,
  };
}

export async function updateSupabaseProfile(userId: string, updates: Partial<User>) {
  if (!supabase) return;
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.avatar !== undefined ? { avatar_url: updates.avatar } : {}),
      ...(updates.bio !== undefined ? { bio: updates.bio || null } : {}),
      ...(updates.city !== undefined ? { city: updates.city || null } : {}),
      ...(updates.neighborhood !== undefined ? { neighborhood: updates.neighborhood || null } : {}),
      ...(updates.role !== undefined ? { role: updates.role || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
