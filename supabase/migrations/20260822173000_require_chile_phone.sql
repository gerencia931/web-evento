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
  phone_digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  normalized_phone text;
begin
  if length(phone_digits) = 11 and left(phone_digits, 2) = '56' then
    normalized_phone := '+56' || right(phone_digits, 9);
  elsif length(phone_digits) = 9 then
    normalized_phone := '+56' || phone_digits;
  else
    raise exception 'Ingresa 9 números para tu teléfono.' using errcode = 'P0001';
  end if;

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
    normalized_phone,
    coalesce(_interests, '{}'::text[]),
    nullif(btrim(coalesce(_influencer, '')), '')
  );
exception
  when unique_violation then
    raise exception 'Ya estás registrado en este bloque horario.' using errcode = '23505';
end;
$$;

revoke all on function public.register_for_event_slot(uuid, text, text, text, text[], text) from public;
grant execute on function public.register_for_event_slot(uuid, text, text, text, text[], text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
