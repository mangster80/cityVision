revoke execute on function public.update_proposal_supporter_count() from public;
revoke execute on function public.update_proposal_supporter_count() from anon;
revoke execute on function public.update_proposal_supporter_count() from authenticated;

grant execute on function public.update_proposal_supporter_count() to postgres;
