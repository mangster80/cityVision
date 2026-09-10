insert into public.translations (key, language, value)
values
  ('proposal.share', 'sv', 'Dela förslag'),
  ('proposal.share', 'en', 'Share proposal'),
  ('proposal.link-copied', 'sv', 'Länken har kopierats.'),
  ('proposal.link-copied', 'en', 'Link copied.')
on conflict (key, language) do update set value = excluded.value;
