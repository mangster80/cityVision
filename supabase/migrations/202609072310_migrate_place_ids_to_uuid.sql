begin;

alter table public.proposals
  drop constraint if exists proposals_place_id_fkey;

alter table public.places
  drop constraint places_pkey;

alter table public.places
  rename column id to source_place_id;

alter table public.places
  add column id uuid not null default gen_random_uuid();

alter table public.places
  add constraint places_pkey primary key (id);

alter table public.proposals
  rename column place_id to source_place_id;

alter table public.proposals
  add column place_id uuid;

update public.proposals proposal
set place_id = place.id
from public.places place
where place.source_place_id = proposal.source_place_id;

do $$
begin
  if exists (select 1 from public.proposals where place_id is null) then
    raise exception 'Cannot migrate proposals.place_id: a proposal references a place that does not exist.';
  end if;
end;
$$;

alter table public.proposals
  alter column place_id set not null,
  drop column source_place_id,
  add constraint proposals_place_id_fkey
    foreign key (place_id) references public.places(id) on delete restrict;

alter table public.places
  drop column source_place_id;

drop index if exists public.proposals_place_id_idx;
create index proposals_place_id_idx on public.proposals(place_id);

drop policy if exists "Authenticated users can create places" on public.places;
create policy "Authenticated users can create places"
  on public.places for insert to authenticated
  with check (true);

commit;
