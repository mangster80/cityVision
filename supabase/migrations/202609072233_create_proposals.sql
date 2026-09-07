create table if not exists public.proposals (
  id text primary key,
  place_id text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  image_before text not null,
  image_after text not null,
  images_before text[] not null default '{}',
  images_after text[] not null default '{}',
  cost integer not null default 0 check (cost >= 0),
  votes integer not null default 0 check (votes >= 0),
  supporters integer not null default 0 check (supporters >= 0),
  comments integer not null default 0 check (comments >= 0),
  municipality text not null,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists proposals_place_id_idx on public.proposals(place_id);
create index if not exists proposals_author_id_idx on public.proposals(author_id);
create index if not exists proposals_created_at_idx on public.proposals(created_at desc);

alter table public.proposals enable row level security;

drop policy if exists "Anyone can read proposals" on public.proposals;
create policy "Anyone can read proposals"
  on public.proposals for select
  using (true);

drop policy if exists "Authenticated users can create their own proposals" on public.proposals;
create policy "Authenticated users can create their own proposals"
  on public.proposals for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update their own proposals" on public.proposals;
create policy "Authors can update their own proposals"
  on public.proposals for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete their own proposals" on public.proposals;
create policy "Authors can delete their own proposals"
  on public.proposals for delete to authenticated
  using (auth.uid() = author_id);
