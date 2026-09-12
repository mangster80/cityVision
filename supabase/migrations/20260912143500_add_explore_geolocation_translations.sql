insert into public.translations (key, language, value)
values
  ('explore.near-me', 'sv', 'Nära mig'),
  ('explore.near-me', 'en', 'Near me'),
  ('explore.locating', 'sv', 'Hämtar position...'),
  ('explore.locating', 'en', 'Locating...'),
  ('explore.location-not-found', 'sv', 'Kunde inte fastställa din plats. Kontrollera webbläsarens platsbehörighet.'),
  ('explore.location-not-found', 'en', 'Could not determine your location. Check your browser location permissions.')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
