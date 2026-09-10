create table if not exists public.translations (
  key text not null,
  language text not null check (language in ('sv', 'en')),
  value text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (key, language)
);

alter table public.translations enable row level security;

drop policy if exists "Anyone can read translations" on public.translations;
create policy "Anyone can read translations"
  on public.translations for select
  using (true);

insert into public.translations (key, language, value)
values
  ('proposal.invite-collaborators', 'sv', 'BJUD IN TILL SAMARBETE'),
  ('proposal.invite-collaborators', 'en', 'INVITE TO COLLABORATE')
on conflict (key, language) do update
set value = excluded.value, updated_at = timezone('utc', now());
