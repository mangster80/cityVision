drop policy if exists "Authenticated users can create places" on public.places;

drop policy if exists "Translation admins can create places" on public.places;
create policy "Translation admins can create places"
  on public.places for insert
  to authenticated
  with check (
    auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid
  );
