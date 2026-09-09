create table if not exists public.proposal_votes (
  proposal_id text not null references public.proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (proposal_id, user_id)
);

create index if not exists proposal_votes_user_id_idx on public.proposal_votes(user_id);

alter table public.proposal_votes enable row level security;

drop policy if exists "Anyone can read proposal votes" on public.proposal_votes;
create policy "Anyone can read proposal votes"
  on public.proposal_votes for select using (true);

drop policy if exists "Users can create their own proposal votes" on public.proposal_votes;
create policy "Users can create their own proposal votes"
  on public.proposal_votes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own proposal votes" on public.proposal_votes;
create policy "Users can update their own proposal votes"
  on public.proposal_votes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own proposal votes" on public.proposal_votes;
create policy "Users can delete their own proposal votes"
  on public.proposal_votes for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.update_proposal_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.proposals set votes = votes + new.value where id = new.proposal_id;
  elsif tg_op = 'UPDATE' then
    update public.proposals set votes = votes + new.value - old.value where id = new.proposal_id;
  else
    update public.proposals set votes = votes - old.value where id = old.proposal_id;
  end if;
  return null;
end;
$$;

drop trigger if exists proposal_votes_update_count on public.proposal_votes;
create trigger proposal_votes_update_count
after insert or update or delete on public.proposal_votes
for each row execute function public.update_proposal_vote_count();
