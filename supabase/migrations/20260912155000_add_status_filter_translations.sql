-- Add status filter translations
insert into public.translations (key, language, value, updated_at)
values
  ('explore.all-statuses', 'sv', 'Alla statusar', timezone('utc', now())),
  ('explore.all-statuses', 'en', 'All statuses', timezone('utc', now())),
  ('explore.status-filter', 'sv', 'Status', timezone('utc', now())),
  ('explore.status-filter', 'en', 'Status', timezone('utc', now())),
  ('explore.status.idea', 'sv', 'Idéer', timezone('utc', now())),
  ('explore.status.idea', 'en', 'Ideas', timezone('utc', now())),
  ('explore.status.review', 'sv', 'Under granskning', timezone('utc', now())),
  ('explore.status.review', 'en', 'Under review', timezone('utc', now())),
  ('explore.status.planned', 'sv', 'Planeras', timezone('utc', now())),
  ('explore.status.planned', 'en', 'Planned', timezone('utc', now())),
  ('explore.status.completed', 'sv', 'Genomfört', timezone('utc', now())),
  ('explore.status.completed', 'en', 'Completed', timezone('utc', now()))
on conflict (key, language) do update set
  value = excluded.value,
  updated_at = timezone('utc', now());
