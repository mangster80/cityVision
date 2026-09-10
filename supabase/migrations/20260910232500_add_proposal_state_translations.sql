insert into public.translations (key, language, value)
values
  ('proposal.current-state', 'sv', 'Nuläge'),
  ('proposal.current-state', 'en', 'Current state'),
  ('proposal.desired-state', 'sv', 'Önskat läge'),
  ('proposal.desired-state', 'en', 'Desired state'),
  ('proposal.how-it-should-be', 'sv', 'Så vill jag att platsen ska vara'),
  ('proposal.how-it-should-be', 'en', 'How I want the place to be')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
