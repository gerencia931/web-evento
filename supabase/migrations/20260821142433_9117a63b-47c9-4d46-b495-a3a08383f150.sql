ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';
UPDATE public.event_slots SET capacity = 40;