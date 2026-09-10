insert into public.translations (key, language, value)
values
  ('proposalactions.confirm-delete-title', 'sv', 'Ta bort kommentar?'),
  ('proposalactions.confirm-delete-title', 'en', 'Delete comment?'),
  ('proposalactions.confirm-delete-comment', 'sv', 'Är du säker på att du vill ta bort kommentaren?'),
  ('proposalactions.confirm-delete-comment', 'en', 'Are you sure you want to delete the comment?'),
  ('proposalactions.cancel', 'sv', 'Avbryt'),
  ('proposalactions.cancel', 'en', 'Cancel')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
