update public.event_slots
set capacity = 50
where start_time = '14:00'::time
  and end_time = '19:00'::time
  and capacity < 50;

notify pgrst, 'reload schema';
