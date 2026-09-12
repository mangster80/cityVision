-- Enable Realtime publication on comments table
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.comments;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

-- Seed translations for live comments indicator
insert into public.translations (key, language, value)
values
  ('proposalactions.live', 'sv', 'Realtid'),
  ('proposalactions.live', 'en', 'Live')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
