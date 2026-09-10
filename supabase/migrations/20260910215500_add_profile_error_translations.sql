insert into public.translations (key, language, value)
values
  ('profile.resource-already-exists', 'sv', 'Profilen finns redan. Försök igen.'),
  ('profile.resource-already-exists', 'en', 'This profile already exists. Please try again.'),
  ('profile.the-profile-could-not-be-loaded', 'sv', 'Profilen kunde inte laddas. Försök igen.'),
  ('profile.the-profile-could-not-be-loaded', 'en', 'The profile could not be loaded. Please try again.')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
