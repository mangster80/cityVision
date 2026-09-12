insert into public.translations (key, language, value)
values
  ('place.all-categories', 'sv', 'Alla kategorier'),
  ('place.all-categories', 'en', 'All categories'),
  ('place.search-placeholder', 'sv', 'Sök bland förslag för denna plats...'),
  ('place.search-placeholder', 'en', 'Search proposals for this place...'),
  ('place.no-matching-proposals', 'sv', 'Inga förslag matchar dina filter.'),
  ('place.no-matching-proposals', 'en', 'No proposals match your filters.')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
