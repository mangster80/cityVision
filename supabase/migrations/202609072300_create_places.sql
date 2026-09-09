create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  municipality text not null,
  description text not null,
  image text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists places_municipality_idx on public.places(municipality);
create index if not exists places_category_idx on public.places(category);

alter table public.places enable row level security;

drop policy if exists "Anyone can read places" on public.places;
create policy "Anyone can read places" on public.places for select using (true);

insert into public.places (name, city, municipality, description, image, lat, lng, category)
select seed.name, seed.city, seed.municipality, seed.description, seed.image, seed.lat, seed.lng, seed.category
from (values
  ('Betongbron vid centrum', 'Stockholm', 'Stockholm', 'En grå passage med klotter som förtjänar att bli en tydligare del av stadsbilden.', 'https://images.unsplash.com/photo-1558941469-9fbd273fb10b?auto=format&fit=crop&w=1200&q=85', 59.33::double precision, 18.06::double precision, 'Broar'),
  ('Västra torget', 'Göteborg', 'Göteborg', 'Ett centralt torg med stor potential för mer liv och grönska.', 'https://images.unsplash.com/photo-1725711388436-5575343a0f76?auto=format&fit=crop&w=1200&q=85', 57.7089::double precision, 11.9746::double precision, 'Torg'),
  ('Åparken', 'Uppsala', 'Uppsala', 'Parkens gångar är mörka och saknar platser att stanna på.', 'https://images.unsplash.com/photo-1614638964097-20e7104dea3c?auto=format&fit=crop&w=1200&q=85', 59.8586::double precision, 17.6389::double precision, 'Park'),
  ('Busshållplats Solrosen', 'Malmö', 'Malmö', 'En viktig hållplats som behöver mer trygghet och väderskydd.', 'https://images.unsplash.com/photo-1629323089093-750bb2411b5e?auto=format&fit=crop&w=1200&q=85', 55.605::double precision, 13.0038::double precision, 'Kollektivtrafik'),
  ('Tunneln under järnvägen', 'Örebro', 'Örebro', 'En mörk tunnel som många undviker efter mörkrets inbrott.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85', 59.2753::double precision, 15.2134::double precision, 'Infrastruktur'),
  ('Hamnpromenaden', 'Helsingborg', 'Helsingborg', 'Slitna sittplatser och vindskydd gör promenaden mindre inbjudande.', 'https://images.unsplash.com/photo-1614638964097-20e7104dea3c?auto=format&fit=crop&w=1200&q=85', 56.0465::double precision, 12.6945::double precision, 'Promenad'),
  ('Biblioteksplatsen', 'Linköping', 'Linköping', 'En stor hårdgjord yta framför biblioteket.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85', 58.4108::double precision, 15.6214::double precision, 'Plats'),
  ('Lekparken vid Åsen', 'Västerås', 'Västerås', 'Lekplatsen kan bli mer inkluderande för barn i alla åldrar.', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85', 59.6099::double precision, 16.5448::double precision, 'Lekplats'),
  ('Kvarnholmens kaj', 'Nacka', 'Nacka', 'Kajstråket har fin utsikt men saknar sittplatser och tydliga mötesplatser.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85', 59.3167::double precision, 18.1333::double precision, 'Promenad'),
  ('Orminge centrum', 'Nacka', 'Nacka', 'Centrumplatsen kan bli grönare, tryggare och mer trivsam under hela dagen.', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=85', 59.3427::double precision, 18.2548::double precision, 'Torg')
) as seed(name, city, municipality, description, image, lat, lng, category)
where not exists (select 1 from public.places place where place.name = seed.name);
