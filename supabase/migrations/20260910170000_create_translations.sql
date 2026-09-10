create table if not exists public.translations (
  key text not null,
  language text not null check (language in ('sv', 'en')),
  value text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (key, language)
);

alter table public.translations enable row level security;

drop policy if exists "Anyone can read translations" on public.translations;
create policy "Anyone can read translations"
  on public.translations for select
  using (true);

insert into public.translations (key, language, value)
values
  ('proposal.invite-collaborators', 'sv', 'BJUD IN TILL SAMARBETE'),
  ('proposal.invite-collaborators', 'en', 'INVITE TO COLLABORATE'),
  ('proposal.deleted', 'sv', 'Förslaget har tagits bort.'),
  ('proposal.deleted', 'en', 'The proposal has been deleted.'),
  ('proposal.loading', 'sv', 'Laddar förslag...'),
  ('proposal.loading', 'en', 'Loading proposal...'),
  ('proposal.load-error', 'sv', 'Förslaget kunde inte hämtas'),
  ('proposal.load-error', 'en', 'The proposal could not be loaded'),
  ('proposal.not-found', 'sv', 'Förslaget hittades inte.'),
  ('proposal.not-found', 'en', 'The proposal was not found.'),
  ('proposal.confirm-delete', 'sv', 'Är du säker på att du vill ta bort detta förslag? Åtgärden kan inte ångras.'),
  ('proposal.confirm-delete', 'en', 'Are you sure you want to delete this proposal? This action cannot be undone.'),
  ('proposal.delete-error', 'sv', 'Förslaget kunde inte tas bort.'),
  ('proposal.delete-error', 'en', 'The proposal could not be deleted.'),
  ('proposal.deleting', 'sv', 'Tar bort...'),
  ('proposal.deleting', 'en', 'Deleting...'),
  ('proposal.delete', 'sv', 'Ta bort förslag'),
  ('proposal.delete', 'en', 'Delete proposal'),
  ('proposal.before', 'sv', 'Före'),
  ('proposal.before', 'en', 'Before'),
  ('proposal.vision', 'sv', 'Vision'),
  ('proposal.vision', 'en', 'Vision'),
  ('proposal.member-label', 'sv', 'STADSLYFT-MEDLEM'),
  ('proposal.member-label', 'en', 'STADSLYFT MEMBER'),
  ('proposal.member-location', 'sv', 'Stockholm · med sedan september 2024'),
  ('proposal.member-location', 'en', 'Stockholm · member since September 2024'),
  ('proposal.collaboration-vision', 'sv', 'SAMARBETE I VISIONEN'),
  ('proposal.collaboration-vision', 'en', 'COLLABORATION IN THE VISION'),
  ('proposal.back-to', 'sv', 'Tillbaka till'),
  ('proposal.back-to', 'en', 'Back to'),
  ('proposal.view-profile', 'sv', 'Visa profilen för'),
  ('proposal.view-profile', 'en', 'View profile for'),
  ('proposal.profile-image', 'sv', 'Profilbild för'),
  ('proposal.profile-image', 'en', 'Profile image for'),
  ('proposalactions.confirm-delete-comment', 'sv', 'Är du säker på att du vill ta bort kommentaren?'),
  ('proposalactions.confirm-delete-comment', 'en', 'Are you sure you want to delete the comment?'),
  ('proposalactions.delete-comment', 'sv', 'Ta bort kommentar'),
  ('proposalactions.delete-comment', 'en', 'Delete comment'),
  ('proposalactions.could-not-delete-comment', 'sv', 'Kommentaren kunde inte tas bort.'),
  ('proposalactions.could-not-delete-comment', 'en', 'The comment could not be deleted.'),
  ('proposalstats.votes', 'sv', 'röster'),
  ('proposalstats.votes', 'en', 'votes'),
  ('proposalstats.supporters', 'sv', 'stödjer'),
  ('proposalstats.supporters', 'en', 'supporters'),
  ('proposalstats.estimated', 'sv', 'uppskattat'),
  ('proposalstats.estimated', 'en', 'estimated'),
  ('proposalstats.comments', 'sv', 'kommentarer'),
  ('proposalstats.comments', 'en', 'comments')
  ,('proposal.all', 'sv', 'Alla')
  ,('proposal.all', 'en', 'All')
  ,('proposal.most-popular', 'sv', 'Populärast')
  ,('proposal.most-popular', 'en', 'Most popular')
  ,('proposal.newest', 'sv', 'Nyast')
  ,('proposal.newest', 'en', 'Newest')
  ,('proposal.most-support', 'sv', 'Mest stöd')
  ,('proposal.most-support', 'en', 'Most support')
  ,('collaborator.demo-saved', 'sv', 'Demo-inbjudan sparad lokalt.')
  ,('collaborator.demo-saved', 'en', 'Demo invitation saved locally.')
  ,('collaborator.send-error', 'sv', 'Inbjudan kunde inte skickas.')
  ,('collaborator.send-error', 'en', 'The invitation could not be sent.')
  ,('collaborator.sent', 'sv', 'Inbjudan skickad.')
  ,('collaborator.sent', 'en', 'Invitation sent.')
  ,('collaborator.email-label', 'sv', 'E-post till samarbetspartner')
  ,('collaborator.email-label', 'en', 'Collaborator email')
  ,('collaborator.sending', 'sv', 'Skickar...')
  ,('collaborator.sending', 'en', 'Sending...')
  ,('collaborator.invite', 'sv', 'Bjud in')
  ,('collaborator.invite', 'en', 'Invite')
  ,('gallery.open', 'sv', 'Öppna')
  ,('gallery.open', 'en', 'Open')
  ,('gallery.show-all', 'sv', 'Visa alla')
  ,('gallery.show-all', 'en', 'Show all')
  ,('gallery.images', 'sv', 'bilder')
  ,('gallery.images', 'en', 'images')
  ,('gallery.open-image', 'sv', 'Öppna bild')
  ,('gallery.open-image', 'en', 'Open image')
  ,('gallery.close', 'sv', 'Stäng bildvisning')
  ,('gallery.close', 'en', 'Close image viewer')
  ,('gallery.previous', 'sv', 'Föregående bild')
  ,('gallery.previous', 'en', 'Previous image')
  ,('gallery.next', 'sv', 'Nästa bild')
  ,('gallery.next', 'en', 'Next image')
  ,('citymap.view-place', 'sv', 'Visa plats')
  ,('citymap.view-place', 'en', 'View place')
  ,('place.loading', 'sv', 'Laddar plats...')
  ,('place.loading', 'en', 'Loading place...')
  ,('place.load-error', 'sv', 'Platsen kunde inte hämtas')
  ,('place.load-error', 'en', 'The place could not be loaded')
  ,('place.not-found', 'sv', 'Platsen hittades inte.')
  ,('place.not-found', 'en', 'The place was not found.')
  ,('place.back-to-explore', 'sv', 'Tillbaka till utforska')
  ,('place.back-to-explore', 'en', 'Back to explore')
  ,('place.about', 'sv', 'OM PLATSEN')
  ,('place.about', 'en', 'ABOUT THE PLACE')
  ,('place.headline', 'sv', 'En plats värd att utveckla.')
  ,('place.headline', 'en', 'A place worth developing.')
  ,('place.created-by', 'sv', 'Förslaget är skapat av')
  ,('place.created-by', 'en', 'Proposal created by')
  ,('place.people-created', 'sv', '{count} personer har lagt förslag')
  ,('place.people-created', 'en', '{count} people have created proposals')
  ,('place.view-profile', 'sv', 'Visa')
  ,('place.view-profile', 'en', 'View')
  ,('place.profile-image', 'sv', 'Profilbild för')
  ,('place.profile-image', 'en', 'Profile image for')
  ,('place.add-proposal', 'sv', 'Lägg till ett förslag')
  ,('place.add-proposal', 'en', 'Add a proposal')
  ,('place.community-proposals', 'sv', 'FÖRSLAG FRÅN GEMENSKAPEN')
  ,('place.community-proposals', 'en', 'PROPOSALS FROM THE COMMUNITY')
  ,('place.ideas-for-place', 'sv', 'visioner för platsen')
  ,('place.ideas-for-place', 'en', 'visions for this place')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
