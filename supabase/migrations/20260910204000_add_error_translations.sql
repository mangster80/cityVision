insert into public.translations (key, language, value)
values
  ('error.title', 'sv', 'Något gick fel'),
  ('error.title', 'en', 'Something went wrong'),
  ('error.description', 'sv', 'Sidan kunde inte laddas korrekt. Försök igen.'),
  ('error.description', 'en', 'The page could not be loaded correctly. Please try again.'),
  ('error.retry', 'sv', 'Försök igen'),
  ('error.retry', 'en', 'Try again')
on conflict (key, language) do update set value = excluded.value;
