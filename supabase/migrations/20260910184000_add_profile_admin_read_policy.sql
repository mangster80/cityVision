drop policy if exists "Translation admins can read all profiles" on public.profiles;

create policy "Translation admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_translation_admin());
