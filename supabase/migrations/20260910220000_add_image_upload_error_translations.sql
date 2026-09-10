insert into public.translations (key, language, value)
values
  ('create.images-could-not-be-uploaded', 'sv', 'Bilderna kunde inte laddas upp. Kontrollera anslutningen och försök igen.'),
  ('create.images-could-not-be-uploaded', 'en', 'The images could not be uploaded. Check your connection and try again.'),
  ('create.image-upload-already-exists', 'sv', 'Bilden finns redan. Försök spara igen.'),
  ('create.image-upload-already-exists', 'en', 'The image already exists. Please try saving again.')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
