create or replace function public.is_translation_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid;
$$;

drop policy if exists "Translation admins can update translations" on public.translations;
create policy "Translation admins can update translations"
  on public.translations for update
  to authenticated
  using (public.is_translation_admin())
  with check (public.is_translation_admin());

drop policy if exists "Translation admins can insert translations" on public.translations;
create policy "Translation admins can insert translations"
  on public.translations for insert
  to authenticated
  with check (public.is_translation_admin());
