alter table public.proposals drop constraint if exists proposals_place_id_fkey;
alter table public.proposals add column if not exists place_id_uuid uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'proposals'
      and column_name = 'place_id' and data_type = 'text'
  ) then
    update public.proposals proposal
    set place_id_uuid = place.id
    from public.places place
    where place.name = proposal.place_id;
  else
    update public.proposals set place_id_uuid = place_id where place_id_uuid is null;
  end if;
end;
$$;

alter table public.proposals drop column if exists place_id;
alter table public.proposals rename column place_id_uuid to place_id;
alter table public.proposals alter column place_id set not null;
alter table public.proposals add constraint proposals_place_id_fkey
  foreign key (place_id) references public.places(id) on delete restrict;
create index if not exists proposals_place_id_idx on public.proposals(place_id);
