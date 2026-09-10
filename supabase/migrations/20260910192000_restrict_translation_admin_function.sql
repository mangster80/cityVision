revoke execute on function public.is_translation_admin() from public;
revoke execute on function public.is_translation_admin() from anon;

grant execute on function public.is_translation_admin() to authenticated;
