insert into public.translations (key, language, value)
values
  ('proposal.confirm-delete-title', 'sv', 'Ta bort förslag?'),
  ('proposal.confirm-delete-title', 'en', 'Delete proposal?'),
  ('proposal.cancel', 'sv', 'Avbryt'),
  ('proposal.cancel', 'en', 'Cancel')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
