create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id text not null references public.proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comments_proposal_id_created_at_idx
  on public.comments(proposal_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
  on public.comments for select
  using (true);

drop policy if exists "Users can create their own comments" on public.comments;
create policy "Users can create their own comments"
  on public.comments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read public profile details" on public.profiles;
create policy "Anyone can read public profile details"
  on public.profiles for select
  using (true);

create or replace function public.update_proposal_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.proposals set comments = comments + 1 where id = new.proposal_id;
  else
    update public.proposals set comments = greatest(comments - 1, 0) where id = old.proposal_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_update_count on public.comments;
create trigger comments_update_count
after insert or delete on public.comments
for each row execute function public.update_proposal_comment_count();

do $$
declare
  demo_user uuid;
begin
  select id into demo_user from public.profiles order by created_at limit 1;
  if demo_user is not null then
    insert into public.comments (proposal_id, user_id, body, created_at)
    select proposal.id, demo_user, seed.body, seed.created_at::timestamptz
    from (values
      ('Varm belysning + mörkgrön färg', 'Det här skulle göra enorm skillnad för hela stråket. Älskar färgpaletten!', '2024-09-08T10:00:00Z'),
      ('Varm belysning + mörkgrön färg', 'Håller med! Gärna med växter som gynnar pollinatörer också.', '2024-09-09T10:00:00Z'),
      ('Varm belysning + mörkgrön färg', 'Som konstnär ser jag stor potential i att arbeta med lokala färger och material.', '2024-09-09T17:00:00Z'),
      ('Grön vägg med klätterväxter', 'Klätterväxter skulle göra passagen mycket mjukare.', '2024-09-09T10:00:00Z'),
      ('Lokal konst i tunneln', 'Ett roterande galleri hade gett tunneln en helt ny identitet.', '2024-09-04T10:00:00Z')
    ) as seed(title, body, created_at)
    join public.proposals proposal on proposal.title = seed.title
    where not exists (
      select 1 from public.comments existing
      where existing.proposal_id = proposal.id and existing.body = seed.body
    );
  end if;
end;
$$;
