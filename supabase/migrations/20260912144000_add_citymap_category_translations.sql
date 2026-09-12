insert into public.translations (key, language, value)
values
  ('citymap.legend', 'sv', 'Kategorier'),
  ('citymap.legend', 'en', 'Categories'),
  ('citymap.proposal', 'sv', 'förslag'),
  ('citymap.proposal', 'en', 'proposal'),
  ('citymap.proposals', 'sv', 'förslag'),
  ('citymap.proposals', 'en', 'proposals')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
