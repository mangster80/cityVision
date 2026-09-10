insert into public.translations (key, language, value)
values
  ('proposalactions.i-support-this-proposal', 'sv', 'Ge stöd åt förslaget'),
  ('proposalactions.i-support-this-proposal', 'en', 'Support this proposal'),
  ('proposalactions.you-support-this-proposal', 'sv', 'Du stödjer förslaget'),
  ('proposalactions.you-support-this-proposal', 'en', 'You support this proposal')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
