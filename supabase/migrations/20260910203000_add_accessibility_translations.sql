insert into public.translations (key, language, value)
values
  ('proposal.share-error', 'sv', 'Länken kunde inte delas eller kopieras.'),
  ('proposal.share-error', 'en', 'The link could not be shared or copied.')
on conflict (key, language) do update set value = excluded.value;
