CREATE TABLE public.event_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,
  label TEXT NOT NULL,
  UNIQUE (start_time, end_time)
);

INSERT INTO public.event_slots (start_time, end_time, capacity, label) VALUES
  ('11:00:00', '12:00:00', 20, '11:00 - 12:00'),
  ('12:00:00', '13:00:00', 20, '12:00 - 13:00'),
  ('13:00:00', '14:00:00', 20, '13:00 - 14:00'),
  ('14:00:00', '15:00:00', 20, '14:00 - 15:00'),
  ('15:00:00', '16:00:00', 20, '15:00 - 16:00'),
  ('16:00:00', '17:00:00', 20, '16:00 - 17:00'),
  ('17:00:00', '18:00:00', 20, '17:00 - 18:00'),
  ('18:00:00', '19:00:00', 20, '18:00 - 19:00');

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.event_slots(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (slot_id, email)
);

GRANT ALL ON public.event_slots TO service_role;
GRANT SELECT ON public.event_slots TO authenticated, anon;
GRANT ALL ON public.event_registrations TO service_role;
GRANT INSERT ON public.event_registrations TO anon;

ALTER TABLE public.event_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public slots are readable" ON public.event_slots
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anonymous users can register" ON public.event_registrations
  FOR INSERT TO anon
  WITH CHECK (true);
