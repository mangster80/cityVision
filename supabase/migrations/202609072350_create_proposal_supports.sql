create table if not exists public.proposal_supports (
  proposal_id text not null references public.proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (proposal_id, user_id)
);

create index if not exists proposal_supports_user_id_idx on public.proposal_supports(user_id);

alter table public.proposal_supports enable row level security;

drop policy if exists "Users can read their own proposal supports" on public.proposal_supports;
create policy "Users can read their own proposal supports"
  on public.proposal_supports for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own proposal supports" on public.proposal_supports;
create policy "Users can create their own proposal supports"
  on public.proposal_supports for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own proposal supports" on public.proposal_supports;
create policy "Users can delete their own proposal supports"
  on public.proposal_supports for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.update_proposal_supporter_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.proposals set supporters = supporters + 1 where id = new.proposal_id;
  else
    update public.proposals set supporters = greatest(supporters - 1, 0) where id = old.proposal_id;
  end if;
  return null;
end;
$$;

drop trigger if exists proposal_supports_update_count on public.proposal_supports;
create trigger proposal_supports_update_count
after insert or delete on public.proposal_supports
for each row execute function public.update_proposal_supporter_count();
