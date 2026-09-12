-- Seed translations for proposal mini map
insert into public.translations (key, language, value)
values
  ('proposal.location', 'sv', 'Plats och omgivning'),
  ('proposal.location', 'en', 'Location & area'),
  ('proposal.open-in-maps', 'sv', 'Öppna i kartor'),
  ('proposal.open-in-maps', 'en', 'Open in Maps'),
  ('proposal.view-place-proposals', 'sv', 'Visa alla förslag för platsen'),
  ('proposal.view-place-proposals', 'en', 'View all proposals for this place'),
  ('proposal.recenter-map', 'sv', 'Centrera plats'),
  ('proposal.recenter-map', 'en', 'Recenter location')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
