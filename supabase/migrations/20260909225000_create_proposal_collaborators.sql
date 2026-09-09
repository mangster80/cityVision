create table if not exists public.proposal_collaborators (
  proposal_id text not null references public.proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (proposal_id, user_id)
);

create index if not exists proposal_collaborators_user_id_idx
  on public.proposal_collaborators(user_id);

alter table public.proposal_collaborators enable row level security;

drop policy if exists "Anyone can read proposal collaborators" on public.proposal_collaborators;
create policy "Anyone can read proposal collaborators"
  on public.proposal_collaborators for select
  using (true);

drop policy if exists "Proposal authors can add collaborators" on public.proposal_collaborators;
create policy "Proposal authors can add collaborators"
  on public.proposal_collaborators for insert to authenticated
  with check (
    exists (
      select 1
      from public.proposals
      where proposals.id = proposal_id
        and proposals.author_id = auth.uid()
    )
  );

drop policy if exists "Proposal authors can remove collaborators" on public.proposal_collaborators;
create policy "Proposal authors can remove collaborators"
  on public.proposal_collaborators for delete to authenticated
  using (
    exists (
      select 1
      from public.proposals
      where proposals.id = proposal_id
        and proposals.author_id = auth.uid()
    )
  );
