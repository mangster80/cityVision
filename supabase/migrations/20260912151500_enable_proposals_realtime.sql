-- Enable Realtime publication on proposals, proposal_votes and proposal_supports tables
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.proposals;
    exception
      when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.proposal_votes;
    exception
      when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.proposal_supports;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
