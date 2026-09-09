create table if not exists public.proposal_collaborator_invites (
  id uuid primary key default gen_random_uuid(),
  proposal_id text not null references public.proposals(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz
);

create index if not exists proposal_collaborator_invites_proposal_idx
  on public.proposal_collaborator_invites(proposal_id);

create index if not exists proposal_collaborator_invites_email_idx
  on public.proposal_collaborator_invites(lower(email));

alter table public.proposal_collaborator_invites enable row level security;

create policy "Proposal authors can create collaborator invites"
  on public.proposal_collaborator_invites for insert to authenticated
  with check (
    inviter_id = auth.uid()
    and exists (
      select 1 from public.proposals
      where proposals.id = proposal_id and proposals.author_id = auth.uid()
    )
  );

create policy "Proposal authors can read collaborator invites"
  on public.proposal_collaborator_invites for select to authenticated
  using (
    inviter_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "Invite recipients can accept collaborator invites"
  on public.proposal_collaborator_invites for update to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (status = 'accepted');

create policy "Invite recipients can join proposals"
  on public.proposal_collaborators for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.proposal_collaborator_invites invites
      where invites.proposal_id = proposal_id
        and lower(invites.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and invites.status = 'pending'
        and invites.expires_at > timezone('utc', now())
    )
  );
