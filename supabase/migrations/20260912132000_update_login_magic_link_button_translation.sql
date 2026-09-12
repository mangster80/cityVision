insert into public.translations (key, language, value)
values
  ('login.use-magic-link', 'sv', 'Fortsätt med email'),
  ('login.use-magic-link', 'en', 'Continue with email')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
