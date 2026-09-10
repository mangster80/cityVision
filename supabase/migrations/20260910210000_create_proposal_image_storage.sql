insert into storage.buckets (id, name, public)
values ('proposal-images', 'proposal-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Authenticated users can upload proposal images" on storage.objects;
create policy "Authenticated users can upload proposal images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proposal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their proposal images" on storage.objects;
create policy "Users can delete their proposal images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proposal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
