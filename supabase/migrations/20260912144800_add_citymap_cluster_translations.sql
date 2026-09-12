insert into public.translations (key, language, value)
values
  ('citymap.places', 'sv', 'platser'),
  ('citymap.places', 'en', 'places'),
  ('citymap.places-in-area', 'sv', 'platser i området'),
  ('citymap.places-in-area', 'en', 'places in area'),
  ('citymap.zoom-in-to-see-all', 'sv', 'Klicka för att zooma in'),
  ('citymap.zoom-in-to-see-all', 'en', 'Click to zoom in')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
