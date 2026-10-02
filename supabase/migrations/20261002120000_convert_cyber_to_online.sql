update public.event_slots
set capacity = 100000
where label ilike '%cyber%';

with canonical_cyber_slot as (
  select id
  from public.event_slots
  where label ilike '%cyber%'
  order by start_time, id
  limit 1
)
update public.event_slots
set label = 'Cyber Online',
    capacity = 100000
where id in (select id from canonical_cyber_slot);

notify pgrst, 'reload schema';
