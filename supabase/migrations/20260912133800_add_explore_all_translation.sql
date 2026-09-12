insert into public.translations (key, language, value, updated_at)
values
  ('explore.all', 'sv', 'Alla', now()),
  ('explore.all', 'en', 'All', now())
on conflict (key, language) do update
set
  value = excluded.value,
  updated_at = excluded.updated_at;
