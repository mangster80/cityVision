insert into public.translations (key, language, value)
values
  ('login.magic-link-error', 'sv', 'Kunde inte skicka magic link till din e-post. Kontrollera adressen eller försök igen senare.'),
  ('login.magic-link-error', 'en', 'Could not send the magic link email. Please check your email address or try again later.'),
  ('login.supabase-not-configured', 'sv', 'Inloggningstjänsten är inte konfigurerad ännu.'),
  ('login.supabase-not-configured', 'en', 'The authentication service is not configured yet.'),
  ('login.network-error', 'sv', 'Kunde inte ansluta till inloggningstjänsten. Kontrollera din anslutning och försök igen.'),
  ('login.network-error', 'en', 'Could not connect to the authentication service. Please check your connection and try again.'),
  ('login.generic-error', 'sv', 'Ett fel uppstod vid inloggningen. Försök igen.'),
  ('login.generic-error', 'en', 'An error occurred during sign-in. Please try again.'),
  ('login.completing-login', 'sv', 'Slutför inloggning...'),
  ('login.completing-login', 'en', 'Completing sign-in...')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
