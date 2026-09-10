with seed(place_name, title, description, image_before, image_after, cost, votes, supporters, comments, municipality, category, created_at) as (
  values
    ('Betongbron vid centrum', 'Varm belysning + mörkgrön färg', 'Måla om betongen i en djup grön ton och addera varm, energieffektiv belysning.', 'photo-1558941469-9fbd273fb10b', 'photo-1519501025264-65ba15a82390', 450000, 1284, 743, 18, 'Stockholm', 'Broar', '2024-09-02'),
    ('Betongbron vid centrum', 'Grön vägg med klätterväxter', 'En robust spaljé med klätterväxter skulle mjuka upp brons hårda uttryck.', 'photo-1558941469-9fbd273fb10b', 'photo-1497250681960-ef046c08a56e', 280000, 892, 516, 12, 'Stockholm', 'Broar', '2024-08-21'),
    ('Betongbron vid centrum', 'Lokal konst i tunneln', 'Låt unga lokala konstnärer skapa ett roterande galleri i passagen.', 'photo-1558941469-9fbd273fb10b', 'photo-1531058020387-3be344556be6', 150000, 624, 401, 9, 'Stockholm', 'Broar', '2024-07-15'),
    ('Västra torget', 'Fler träd och regnbäddar', 'Skapa skugga, bättre dagvattenhantering och en plats att mötas på.', 'photo-1725711388436-5575343a0f76', 'photo-1441974231531-c6227db76b6e', 680000, 1044, 812, 24, 'Göteborg', 'Torg', '2024-09-05'),
    ('Västra torget', 'Torget som vardagsrum', 'Mobila bänkar, små scener och bättre kvällsljus gör torget levande hela dagen.', 'photo-1725711388436-5575343a0f76', 'photo-1497366754035-f200968a6e72', 390000, 731, 498, 14, 'Göteborg', 'Torg', '2024-08-11'),
    ('Åparken', 'Ljusare promenadstråk', 'Låg, varm belysning längs gångarna gör parken tryggare utan att störa djurlivet.', 'photo-1614638964097-20e7104dea3c', 'photo-1497250681960-ef046c08a56e', 320000, 967, 689, 20, 'Uppsala', 'Park', '2024-09-01'),
    ('Åparken', 'Picknicköar vid ån', 'Små träplattformar med sittplatser skapar fler anledningar att stanna.', 'photo-1614638964097-20e7104dea3c', 'photo-1500534623283-312aade485b7', 210000, 544, 367, 8, 'Uppsala', 'Park', '2024-07-30'),
    ('Busshållplats Solrosen', 'Trygg hållplats med grönt tak', 'Väderskydd, realtidsinfo och ett grönt tak i återvunnet material.', 'photo-1629323089093-750bb2411b5e', 'photo-1497366811353-6870744d04b2', 510000, 1156, 920, 31, 'Malmö', 'Kollektivtrafik', '2024-09-04'),
    ('Busshållplats Solrosen', 'Konstnärligt väderskydd', 'Ett färgstarkt skydd designat tillsammans med skolor i området.', 'photo-1629323089093-750bb2411b5e', 'photo-1531058020387-3be344556be6', 290000, 479, 322, 7, 'Malmö', 'Kollektivtrafik', '2024-06-18'),
    ('Tunneln under järnvägen', 'Ljusinstallation under jord', 'Ljuspaneler som reagerar mjukt på rörelse och skapar en tryggare passage.', 'photo-1497366811353-6870744d04b2', 'photo-1518005020951-eccb494ad742', 740000, 1320, 1001, 28, 'Örebro', 'Infrastruktur', '2024-09-06'),
    ('Tunneln under järnvägen', 'Cykelstråk i färg', 'Markera cykel- och gångtrafik tydligare och ge tunneln en egen identitet.', 'photo-1511818966892-d7d671e672a2', 'photo-1519501025264-65ba15a82390', 180000, 388, 244, 6, 'Örebro', 'Infrastruktur', '2024-05-12'),
    ('Hamnpromenaden', 'Vindskydd i trä', 'Naturliga material och fler bänkar gör havet tillgängligt även blåsiga dagar.', 'photo-1507525428034-b723cf961d3e', 'photo-1497250681960-ef046c08a56e', 430000, 811, 601, 11, 'Helsingborg', 'Promenad', '2024-08-02'),
    ('Hamnpromenaden', 'Kvällsljus längs kajen', 'Diskret belysning som lyfter vattnet och gör promenaden säkrare.', 'photo-1507525428034-b723cf961d3e', 'photo-1518005020951-eccb494ad742', 350000, 677, 455, 10, 'Helsingborg', 'Promenad', '2024-07-03'),
    ('Biblioteksplatsen', 'Stadsodling framför biblioteket', 'Odla tillsammans med grannar och skapa en mjukare entré till biblioteket.', 'photo-1614638964097-20e7104dea3c', 'photo-1441974231531-c6227db76b6e', 160000, 604, 432, 13, 'Linköping', 'Plats', '2024-08-25'),
    ('Lekparken vid Åsen', 'Lek för alla', 'En inkluderande lekplats med fler sinnesintryck och tillgängliga redskap.', 'photo-1773242567388-ddbe1b9cb343', 'photo-1500534623283-312aade485b7', 620000, 988, 755, 19, 'Västerås', 'Lekplats', '2024-08-29'),
    ('Kvarnholmens kaj', 'Kajen som vardagsrum', 'Fler träbänkar, planteringar och mjuk belysning gör kajen till en plats att stanna på.', 'photo-1507525428034-b723cf961d3e', 'photo-1497250681960-ef046c08a56e', 340000, 516, 362, 8, 'Nacka', 'Promenad', '2024-09-03'),
    ('Orminge centrum', 'Grönare centrumplats', 'Skapa fler träd, regnbäddar och flexibla sittplatser för boende och besökare.', 'photo-1477959858617-67f85cf4f1df', 'photo-1441974231531-c6227db76b6e', 580000, 689, 477, 11, 'Nacka', 'Torg', '2024-09-07')
)
insert into public.proposals (
  id, place_id, author_id, title, description, image_before, image_after,
  images_before, images_after, cost, votes, supporters, comments,
  municipality, category, created_at, updated_at
)
select
  gen_random_uuid()::text,
  place.id,
  (select id from public.profiles order by created_at asc limit 1),
  seed.title,
  seed.description,
  'https://images.unsplash.com/' || seed.image_before || '?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/' || seed.image_after || '?auto=format&fit=crop&w=1200&q=85',
  array['https://images.unsplash.com/' || seed.image_before || '?auto=format&fit=crop&w=1200&q=85'],
  array['https://images.unsplash.com/' || seed.image_after || '?auto=format&fit=crop&w=1200&q=85'],
  seed.cost, seed.votes, seed.supporters, seed.comments, seed.municipality,
  seed.category, seed.created_at::timestamptz, seed.created_at::timestamptz
from seed
join public.places place on place.name = seed.place_name
where exists (select 1 from public.profiles)
  and not exists (
    select 1 from public.proposals proposal
    where proposal.title = seed.title and proposal.place_id = place.id
  );
