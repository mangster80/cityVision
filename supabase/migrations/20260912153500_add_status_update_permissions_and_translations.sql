-- Add status update policies & translations for municipal/admin status updates

-- Allow users with admin or municipal role (or admin user id) to update proposals status
-- Note: In Supabase, proposal update policy can be defined as follows:
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'proposals' and policyname = 'Admins and authors can update proposals'
  ) then
    create policy "Admins and authors can update proposals"
      on public.proposals
      for update
      to authenticated
      using (
        auth.uid() = author_id 
        or auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid
        or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and (profiles.role = 'Admin' or profiles.role = 'Kommunansvarig')
        )
      )
      with check (
        auth.uid() = author_id 
        or auth.uid() = 'fdaade01-5f94-456b-ba84-647069363d45'::uuid
        or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and (profiles.role = 'Admin' or profiles.role = 'Kommunansvarig')
        )
      );
  end if;
end $$;

-- Insert/update translations for status update dialog
insert into public.translations (key, language, value, updated_at)
values
  ('proposal.update-status-button', 'sv', 'Ändra status', timezone('utc', now())),
  ('proposal.update-status-button', 'en', 'Update status', timezone('utc', now())),
  ('proposal.status.admin-label', 'sv', 'Kommun / Admin', timezone('utc', now())),
  ('proposal.status.admin-label', 'en', 'Municipality / Admin', timezone('utc', now())),
  ('proposal.status.update-title', 'sv', 'Uppdatera förslagsstatus', timezone('utc', now())),
  ('proposal.status.update-title', 'en', 'Update proposal status', timezone('utc', now())),
  ('proposal.status.choose-status', 'sv', 'Välj ny status', timezone('utc', now())),
  ('proposal.status.choose-status', 'en', 'Select new status', timezone('utc', now())),
  ('proposal.status.official-note-label', 'sv', 'Officiellt meddelande från kommunen / ansvarig', timezone('utc', now())),
  ('proposal.status.official-note-label', 'en', 'Official note from municipality / responsible party', timezone('utc', now())),
  ('proposal.status.official-note-placeholder', 'sv', 'T.ex. "Projektering pågår tillsammans med trafikkontoret inför våren 2026."', timezone('utc', now())),
  ('proposal.status.official-note-placeholder', 'en', 'E.g. "Engineering design in progress with transport dept for spring 2026."', timezone('utc', now())),
  ('proposal.status.official-note-help', 'sv', 'Detta meddelande visas offentligt på förslagets tidslinje.', timezone('utc', now())),
  ('proposal.status.official-note-help', 'en', 'This note will be shown publicly on the proposal timeline.', timezone('utc', now())),
  ('proposal.status.updated-success', 'sv', 'Förslagets status har uppdaterats!', timezone('utc', now())),
  ('proposal.status.updated-success', 'en', 'Proposal status updated successfully!', timezone('utc', now())),
  ('proposal.status.update-error', 'sv', 'Kunde inte uppdatera förslagets status.', timezone('utc', now())),
  ('proposal.status.update-error', 'en', 'Could not update proposal status.', timezone('utc', now())),
  ('common.cancel', 'sv', 'Avbryt', timezone('utc', now())),
  ('common.cancel', 'en', 'Cancel', timezone('utc', now())),
  ('common.save', 'sv', 'Spara status', timezone('utc', now())),
  ('common.save', 'en', 'Save status', timezone('utc', now())),
  ('common.saving', 'sv', 'Sparar...', timezone('utc', now())),
  ('common.saving', 'en', 'Saving...', timezone('utc', now()))
on conflict (key, language) do update set
  value = excluded.value,
  updated_at = timezone('utc', now());
