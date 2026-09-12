-- Add status, status_updated_at, status_note columns to proposals table if not exists
alter table public.proposals
  add column if not exists status text not null default 'idea' check (status in ('idea', 'review', 'planned', 'completed')),
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_note text;

-- Seed translations for proposal timeline and status
insert into public.translations (key, language, value)
values
  ('proposal.timeline-title', 'sv', 'Status & framsteg'),
  ('proposal.timeline-title', 'en', 'Status & progress'),
  ('proposal.status.idea', 'sv', 'Idé skapad'),
  ('proposal.status.idea', 'en', 'Idea created'),
  ('proposal.status.idea-desc', 'sv', 'Förslaget har publicerats på Stadslyft och samlar röster, stöd och feedback från invånare.'),
  ('proposal.status.idea-desc', 'en', 'The proposal has been published on Stadslyft and is gathering votes, support, and community feedback.'),
  ('proposal.status.review', 'sv', 'Granskas'),
  ('proposal.status.review', 'en', 'Under review'),
  ('proposal.status.review-desc', 'sv', 'Förslaget är under granskning eller dialog med kommunen, fastighetsägare och lokala aktörer.'),
  ('proposal.status.review-desc', 'en', 'The proposal is being reviewed and discussed with the municipality, property owners, and local stakeholders.'),
  ('proposal.status.planned', 'sv', 'Planeras'),
  ('proposal.status.planned', 'en', 'Planned'),
  ('proposal.status.planned-desc', 'sv', 'Förslaget har godkänts eller prioriterats och ingår i kommande genomförandeplaner.'),
  ('proposal.status.planned-desc', 'en', 'The proposal has been approved or prioritized and is part of upcoming implementation plans.'),
  ('proposal.status.completed', 'sv', 'Genomfört'),
  ('proposal.status.completed', 'en', 'Completed'),
  ('proposal.status.completed-desc', 'sv', 'Förbättringen är färdigställd på platsen och redo att upplevas!'),
  ('proposal.status.completed-desc', 'en', 'The improvement has been completed on site and is ready to enjoy!'),
  ('proposal.status.note', 'sv', 'Kommentar från kommunen/ansvarig'),
  ('proposal.status.note', 'en', 'Note from municipality/responsible party')
on conflict (key, language) do update
set value = excluded.value,
    updated_at = timezone('utc', now());
