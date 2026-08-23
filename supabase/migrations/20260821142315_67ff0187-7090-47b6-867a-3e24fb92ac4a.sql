
DO $$
DECLARE am_id uuid; pm_id uuid;
BEGIN
  INSERT INTO public.event_slots (start_time, end_time, capacity, label)
  VALUES ('11:00','14:00', 120, 'Bloque AM · 11:00 - 14:00') RETURNING id INTO am_id;
  INSERT INTO public.event_slots (start_time, end_time, capacity, label)
  VALUES ('14:00','19:00', 200, 'Bloque PM · 14:00 - 19:00') RETURNING id INTO pm_id;

  UPDATE public.event_registrations r
  SET slot_id = CASE WHEN s.start_time < '14:00' THEN am_id ELSE pm_id END
  FROM public.event_slots s
  WHERE r.slot_id = s.id AND s.id NOT IN (am_id, pm_id);

  DELETE FROM public.event_slots WHERE id NOT IN (am_id, pm_id);
END $$;
