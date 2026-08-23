do $$
declare
  am_id uuid;
  pm_id uuid;
begin
  insert into public.event_slots (start_time, end_time, capacity, label)
  values ('11:00', '14:00', 40, 'Bloque AM · 11:00 - 14:00')
  on conflict (start_time, end_time) do update
  set capacity = excluded.capacity,
      label = excluded.label
  returning id into am_id;

  insert into public.event_slots (start_time, end_time, capacity, label)
  values ('14:00', '19:00', 40, 'Bloque PM · 14:00 - 19:00')
  on conflict (start_time, end_time) do update
  set capacity = excluded.capacity,
      label = excluded.label
  returning id into pm_id;

  update public.event_registrations r
  set slot_id = case when s.start_time < '14:00'::time then am_id else pm_id end
  from public.event_slots s
  where r.slot_id = s.id
    and s.id not in (am_id, pm_id);

  delete from public.event_slots
  where id not in (am_id, pm_id);
end $$;

create or replace function public.get_event_slots_with_counts()
returns table (
  id uuid,
  label text,
  start_time time without time zone,
  end_time time without time zone,
  capacity integer,
  registered integer,
  available integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.label,
    s.start_time,
    s.end_time,
    s.capacity,
    count(r.id)::integer as registered,
    greatest(s.capacity - count(r.id)::integer, 0) as available
  from public.event_slots s
  left join public.event_registrations r on r.slot_id = s.id
  group by s.id, s.label, s.start_time, s.end_time, s.capacity
  order by s.start_time;
$$;

create or replace function public.register_for_event_slot(
  _slot_id uuid,
  _name text,
  _email text,
  _phone text default null,
  _interests text[] default '{}'::text[],
  _influencer text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_slot public.event_slots%rowtype;
  registration_count integer;
  normalized_email text := lower(btrim(_email));
begin
  select *
  into target_slot
  from public.event_slots
  where id = _slot_id
  for update;

  if not found then
    raise exception 'El bloque horario seleccionado no existe.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.event_registrations
    where slot_id = _slot_id and lower(email) = normalized_email
  ) then
    raise exception 'Ya estás registrado en este bloque horario.' using errcode = '23505';
  end if;

  select count(*)::integer
  into registration_count
  from public.event_registrations
  where slot_id = _slot_id;

  if registration_count >= target_slot.capacity then
    raise exception 'El bloque horario seleccionado ya no tiene cupos disponibles.' using errcode = 'P0001';
  end if;

  insert into public.event_registrations (
    slot_id,
    name,
    email,
    phone,
    interests,
    influencer
  )
  values (
    _slot_id,
    btrim(_name),
    normalized_email,
    nullif(btrim(coalesce(_phone, '')), ''),
    coalesce(_interests, '{}'::text[]),
    nullif(btrim(coalesce(_influencer, '')), '')
  );
exception
  when unique_violation then
    raise exception 'Ya estás registrado en este bloque horario.' using errcode = '23505';
end;
$$;

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para reclamar acceso de administrador.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('puntacaribe_claim_first_admin'));

  select count(*)::integer
  into admin_count
  from public.user_roles
  where role = 'admin';

  if admin_count > 0 then
    raise exception 'Ya existe un administrador en el sistema.' using errcode = 'P0001';
  end if;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'admin');

  return true;
end;
$$;

revoke all on function public.get_event_slots_with_counts() from public;
revoke all on function public.register_for_event_slot(uuid, text, text, text, text[], text) from public;
revoke all on function public.claim_first_admin() from public;

revoke insert on public.event_registrations from anon;

grant execute on function public.get_event_slots_with_counts() to anon, authenticated, service_role;
grant execute on function public.register_for_event_slot(uuid, text, text, text, text[], text) to anon, authenticated, service_role;
grant execute on function public.claim_first_admin() to authenticated, service_role;

notify pgrst, 'reload schema';
