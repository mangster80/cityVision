import { User } from "@/types";

export type StoredUser = {
  user: User | null;
  language: "sv" | "en";
  theme: "light" | "dark";
  userAgent: string;
};

const userStorageKey = "cityvision-user";
const demoModeStorageKey = "cityvision-demo-auth";

export function isDemoLoginEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(demoModeStorageKey) === "true";
}

export function setDemoLoginEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    window.localStorage.setItem(demoModeStorageKey, "true");
    return;
  }
  window.localStorage.removeItem(demoModeStorageKey);
}

export function getStoredUserRecord(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const rawUser = window.localStorage.getItem(userStorageKey);
  if (!rawUser) return null;
  try {
    const parsed: unknown = JSON.parse(rawUser);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<StoredUser> & Partial<User>;
    const legacyUser = typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.avatar === "string"
      ? { id: candidate.id, name: candidate.name, avatar: candidate.avatar }
      : null;
    const nestedUser = candidate.user && typeof candidate.user === "object"
      && typeof candidate.user.id === "string" && typeof candidate.user.name === "string" && typeof candidate.user.avatar === "string"
      ? candidate.user
      : null;
    if (!legacyUser && !nestedUser && candidate.user !== null) return null;
    const language = candidate.language === "en" || candidate.language === "sv"
      ? candidate.language
      : window.localStorage.getItem("cityvision-language") === "en" ? "en" : "sv";
    const theme = candidate.theme === "dark" || candidate.theme === "light"
      ? candidate.theme
      : window.localStorage.getItem("cityvision-theme") === "dark" ? "dark" : "light";
    const storedUser = nestedUser ?? legacyUser;
    const migratedUser = storedUser?.id === "u1" && storedUser.name === "Sally Sjöström"
      ? { ...storedUser, name: "Demouser" }
      : storedUser;
    const record: StoredUser = {
      user: migratedUser,
      language,
      theme,
      userAgent: typeof candidate.userAgent === "string" ? candidate.userAgent : window.navigator.userAgent
    };
    window.localStorage.setItem(userStorageKey, JSON.stringify(record));
    window.localStorage.removeItem("cityvision-language");
    window.localStorage.removeItem("cityvision-theme");
    return record;
  } catch {
    return null;
  }
}

export function getStoredUser(): User | null {
  const record = getStoredUserRecord();
  return record?.user ?? null;
}

export function setStoredUser(user: User, preferences?: Partial<Pick<StoredUser, "language" | "theme">>) {
  const existing = getStoredUserRecord();
  const record: StoredUser = {
    user,
    language: preferences?.language ?? existing?.language ?? "sv",
    theme: preferences?.theme ?? existing?.theme ?? "light",
    userAgent: existing?.userAgent ?? window.navigator.userAgent
  };
  window.localStorage.setItem(userStorageKey, JSON.stringify(record));
}

export function updateStoredUser(user: Partial<User>) {
  if (typeof window === "undefined") return;
  const existing = getStoredUserRecord();
  if (!existing?.user) return;
  const nextUser: User = { ...existing.user, ...user };
  window.localStorage.setItem(userStorageKey, JSON.stringify({ ...existing, user: nextUser }));
}

export function updateStoredUserPreferences(preferences: Partial<Pick<StoredUser, "language" | "theme">>) {
  if (typeof window === "undefined") return;
  const existing = getStoredUserRecord();
  const record: StoredUser = {
    user: existing?.user ?? null,
    language: preferences.language ?? existing?.language ?? "sv",
    theme: preferences.theme ?? existing?.theme ?? "light",
    userAgent: existing?.userAgent ?? window.navigator.userAgent
  };
  window.localStorage.setItem(userStorageKey, JSON.stringify(record));
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  const existing = getStoredUserRecord();
  if (existing) {
    window.localStorage.setItem(userStorageKey, JSON.stringify({ ...existing, user: null }));
  } else {
    window.localStorage.setItem(userStorageKey, JSON.stringify({ user: null, language: "sv", theme: "light", userAgent: window.navigator.userAgent }));
  }
  window.localStorage.removeItem("cityvision-demo-auth");
}
