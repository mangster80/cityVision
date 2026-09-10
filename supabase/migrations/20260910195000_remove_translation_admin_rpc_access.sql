drop policy if exists "Translation admins can read all profiles" on public.profiles;
create policy "Translation admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid);

drop policy if exists "Translation admins can update translations" on public.translations;
create policy "Translation admins can update translations"
  on public.translations for update
  to authenticated
  using (auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid)
  with check (auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid);

drop policy if exists "Translation admins can insert translations" on public.translations;
create policy "Translation admins can insert translations"
  on public.translations for insert
  to authenticated
  with check (auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid);

revoke execute on function public.is_translation_admin() from public;
revoke execute on function public.is_translation_admin() from anon;
revoke execute on function public.is_translation_admin() from authenticated;
