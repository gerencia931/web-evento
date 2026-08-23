alter table public.event_registrations add column if not exists influencer text;

revoke all on function public.has_role(uuid, public.app_role) from anon;
revoke all on function public.update_updated_at_column() from anon;
revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.update_updated_at_column() from public;
