drop policy if exists "Users can replace their proposal images" on storage.objects;
create policy "Users can replace their proposal images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'proposal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'proposal-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
