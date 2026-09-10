revoke execute on function public.update_proposal_vote_count() from public;
revoke execute on function public.update_proposal_vote_count() from anon;
revoke execute on function public.update_proposal_vote_count() from authenticated;

grant execute on function public.update_proposal_vote_count() to postgres;
