-- Update translations for Hype / Hajpa feature
insert into public.translations (key, language, value, updated_at) values
  ('about.step3Text', 'sv', 'Samla röster, hajps och diskutera idéer live med grannar. Dela förslaget enkelt vidare till andra i området.', timezone('utc', now())),
  ('about.step3Text', 'en', 'Gather votes, hypes, and discuss ideas live with neighbors. Easily share proposals with your local community.', timezone('utc', now())),
  ('explore.mostSupport', 'sv', 'Mest hajpade', timezone('utc', now())),
  ('explore.mostSupport', 'en', 'Most hyped', timezone('utc', now())),
  ('proposal.most-support', 'sv', 'Mest hajpade', timezone('utc', now())),
  ('proposal.most-support', 'en', 'Most hyped', timezone('utc', now())),
  ('profile.ideas-supported', 'sv', 'idéer hajpade', timezone('utc', now())),
  ('profile.ideas-supported', 'en', 'ideas hyped', timezone('utc', now())),
  ('profile.supported-proposals', 'sv', 'Hajpade förslag', timezone('utc', now())),
  ('profile.supported-proposals', 'en', 'Hyped proposals', timezone('utc', now())),
  ('proposal.status.idea-desc', 'sv', 'Förslaget har publicerats på Stadslyft och samlar röster, hajps och feedback från invånare.', timezone('utc', now())),
  ('proposal.status.idea-desc', 'en', 'The proposal has been published on Stadslyft and is gathering votes, hypes, and community feedback.', timezone('utc', now())),
  ('proposalactions.could-not-update-support', 'sv', 'Kunde inte uppdatera hajpen.', timezone('utc', now())),
  ('proposalactions.could-not-update-support', 'en', 'Could not update hype.', timezone('utc', now())),
  ('proposalactions.i-support-this-proposal', 'sv', 'Hajpa förslaget', timezone('utc', now())),
  ('proposalactions.i-support-this-proposal', 'en', 'Hype proposal', timezone('utc', now())),
  ('proposalactions.you-support-this-proposal', 'sv', 'Du har hajpat!', timezone('utc', now())),
  ('proposalactions.you-support-this-proposal', 'en', 'Hyped!', timezone('utc', now())),
  ('proposalstats.supporters', 'sv', 'hajps', timezone('utc', now())),
  ('proposalstats.supporters', 'en', 'hypes', timezone('utc', now())),
  ('home.votes', 'sv', 'hajps', timezone('utc', now())),
  ('home.votes', 'en', 'hypes', timezone('utc', now()))
on conflict (key, language) do update set
  value = excluded.value,
  updated_at = timezone('utc', now());
