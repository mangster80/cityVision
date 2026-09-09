create or replace view public.public_profiles as
select
  id,
  name,
  avatar_url,
  bio,
  city,
  neighborhood,
  role
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
