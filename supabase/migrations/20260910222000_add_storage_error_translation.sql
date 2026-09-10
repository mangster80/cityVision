insert into public.translations (key, language, value)
values
  ('create.image-storage-unavailable', 'sv', 'Bildlagringen är inte tillgänglig just nu. Försök igen senare.'),
  ('create.image-storage-unavailable', 'en', 'Image storage is not available right now. Please try again later.')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
