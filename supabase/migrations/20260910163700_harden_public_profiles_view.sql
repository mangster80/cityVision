alter view public.public_profiles
  set (security_invoker = true);

drop policy if exists "Anyone can read public profile details" on public.profiles;
create policy "Anyone can read public profile details"
  on public.profiles for select
  to anon, authenticated
  using (true);
