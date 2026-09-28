alter table public.event_registrations
  add column if not exists campaign text not null default 'sale';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_registrations_campaign_check'
      and conrelid = 'public.event_registrations'::regclass
  ) then
    alter table public.event_registrations
      add constraint event_registrations_campaign_check
      check (campaign in ('sale', 'cyber'));
  end if;
end $$;

update public.event_slots
set start_time = '12:00',
    end_time = '15:00',
    capacity = 70,
    label = 'Cyber · Bloque 1 · 12:00 a 15:00'
where start_time = '00:00'
  and end_time = '23:59'
  and label ilike '%cyber%';

insert into public.event_slots (start_time, end_time, capacity, label)
values
  ('12:00', '15:00', 70, 'Cyber · Bloque 1 · 12:00 a 15:00'),
  ('15:00', '18:00', 70, 'Cyber · Bloque 2 · 15:00 a 18:00')
on conflict (start_time, end_time) do update
set capacity = excluded.capacity,
    label = excluded.label;

drop function if exists public.register_for_event_slot(uuid, text, text, text, text[], text);

create or replace function public.register_for_event_slot(
  _slot_id uuid,
  _name text,
  _email text,
  _phone text default null,
  _interests text[] default '{}'::text[],
  _influencer text default null,
  _campaign text default 'cyber'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_slot public.event_slots%rowtype;
  registration_count integer;
  reactivated_id uuid;
  normalized_email text := lower(btrim(_email));
  normalized_campaign text := lower(btrim(coalesce(_campaign, 'cyber')));
  phone_digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  normalized_phone text;
begin
  if normalized_campaign not in ('sale', 'cyber') then
    raise exception 'La campaña seleccionada no existe.' using errcode = 'P0001';
  end if;

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
    raise exception 'La campaña seleccionada no existe.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.event_registrations
    where slot_id = _slot_id
      and lower(email) = normalized_email
      and campaign = normalized_campaign
      and status <> 'cancelado'
  ) then
    raise exception 'Ya estás registrado en esta campaña.' using errcode = '23505';
  end if;

  select count(*)::integer
  into registration_count
  from public.event_registrations
  where slot_id = _slot_id
    and campaign = normalized_campaign
    and status <> 'cancelado';

  if registration_count >= target_slot.capacity then
    raise exception 'La campaña seleccionada ya no tiene cupos disponibles.' using errcode = 'P0001';
  end if;

  with cancelled_registration as (
    select id
    from public.event_registrations
    where slot_id = _slot_id
      and lower(email) = normalized_email
      and campaign = normalized_campaign
      and status = 'cancelado'
    order by updated_at desc, created_at desc
    limit 1
  ),
  reactivated_registration as (
    update public.event_registrations
    set
      name = btrim(_name),
      email = normalized_email,
      phone = normalized_phone,
      interests = coalesce(_interests, '{}'::text[]),
      influencer = nullif(btrim(coalesce(_influencer, '')), ''),
      campaign = normalized_campaign,
      status = 'nuevo'
    where id in (select id from cancelled_registration)
    returning id
  )
  select id
  into reactivated_id
  from reactivated_registration;

  if reactivated_id is not null then
    return;
  end if;

  insert into public.event_registrations (
    slot_id,
    name,
    email,
    phone,
    interests,
    influencer,
    campaign
  )
  values (
    _slot_id,
    btrim(_name),
    normalized_email,
    normalized_phone,
    coalesce(_interests, '{}'::text[]),
    nullif(btrim(coalesce(_influencer, '')), ''),
    normalized_campaign
  );
exception
  when unique_violation then
    raise exception 'Ya estás registrado en esta campaña.' using errcode = '23505';
end;
$$;

revoke all on function public.register_for_event_slot(uuid, text, text, text, text[], text, text) from public;
grant execute on function public.register_for_event_slot(uuid, text, text, text, text[], text, text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
