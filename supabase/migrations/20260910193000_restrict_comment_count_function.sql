revoke execute on function public.update_proposal_comment_count() from public;
revoke execute on function public.update_proposal_comment_count() from anon;
revoke execute on function public.update_proposal_comment_count() from authenticated;

grant execute on function public.update_proposal_comment_count() to postgres;
