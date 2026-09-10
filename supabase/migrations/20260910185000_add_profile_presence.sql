alter table public.profiles
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists last_seen_at timestamptz;
