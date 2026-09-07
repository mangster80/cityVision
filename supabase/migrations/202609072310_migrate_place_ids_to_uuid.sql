alter table public.places
  rename column id to legacy_id;

alter table public.places
  add column id uuid default gen_random_uuid();

update public.places
set id = case legacy_id
  when 'p1' then 'ae6eaf42-e3b6-4d71-8030-0f0faf4db589'::uuid
  when 'p2' then '17d1a90b-5121-48fa-99c0-50ee0f873e12'::uuid
  when 'p3' then '47fb4a74-e770-4512-a795-4ea1685a1b95'::uuid
  when 'p4' then 'c35b8a93-57e7-4510-9f79-c76c07faf7c7'::uuid
  when 'p5' then '1992d07b-92c4-42b7-89bf-0e7d8e4d6f3a'::uuid
  when 'p6' then 'b30a570d-d3a4-405e-855f-5eeec19efc04'::uuid
  when 'p7' then '7fed168d-d59e-408e-89df-9cec3b45ae47'::uuid
  when 'p8' then 'e377b4d9-6cae-4ed4-87ee-ca1f249ed1a8'::uuid
  when 'p9' then '92b452d5-ae8f-4a83-8b1f-8177c6340a2d'::uuid
  when 'p10' then '4de10e9a-8b82-453b-93ac-a1e41c519934'::uuid
  else gen_random_uuid()
end;

alter table public.places
  alter column id set not null;

alter table public.places
  drop constraint places_pkey,
  add constraint places_pkey primary key (id),
  add constraint places_legacy_id_key unique (legacy_id);

drop policy if exists "Authenticated users can create places" on public.places;
create policy "Authenticated users can create places"
  on public.places for insert to authenticated
  with check (true);

do $$
begin
  if exists (
    select 1
    from public.proposals proposal
    left join public.places place on place.legacy_id = proposal.place_id
    where place.id is null
  ) then
    raise exception 'Cannot migrate proposals.place_id: at least one proposal references a place that does not exist in public.places.';
  end if;
end;
$$;

alter table public.proposals
  add column place_uuid uuid;

update public.proposals proposal
set place_uuid = place.id
from public.places place
where place.legacy_id = proposal.place_id;

alter table public.proposals
  alter column place_uuid set not null;

alter table public.proposals
  drop column place_id;

alter table public.proposals
  rename column place_uuid to place_id;

drop index if exists public.proposals_place_id_idx;
create index proposals_place_id_idx on public.proposals(place_id);

alter table public.proposals
  add constraint proposals_place_id_fkey
  foreign key (place_id) references public.places(id) on delete restrict;
