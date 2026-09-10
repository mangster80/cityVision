insert into public.translations (key, language, value)
values
  ('create.session-expired', 'sv', 'Din inloggning har gått ut. Logga in igen för att ladda upp bilder och spara förslaget.'),
  ('create.session-expired', 'en', 'Your session has expired. Sign in again to upload images and save the proposal.')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
