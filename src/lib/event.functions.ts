import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const slotSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  capacity: z.number().int(),
  registered: z.number().int(),
  available: z.number().int(),
});

export type Slot = z.infer<typeof slotSchema>;

export const CURRENT_CAMPAIGN = "cyber";

export const INFLUENCER_OPTIONS = [
  "El Ranty",
  "Otakin",
  "Juan QUERALTO",
  "Laloninatejedora",
  "Ignacioruiz",
  "Luisdelviento",
  "Purowebeo / Simón Salas",
  "Prensachilena",
  "Ninguno",
] as const;

export const INTEREST_OPTIONS = [
  "Programa TODO INCLUIDO CARIBE",
  "Programa CRUCEROS",
  "Programas BRASIL",
  "Circuitos EUROPA y otros destinos",
  "Viajes grupales",
  "Feria Cantón",
  "Programa Japón",
] as const;

export const registrationSchema = z.object({
  slot_id: z.string().uuid({ message: "No pudimos preparar la campaña seleccionada" }),
  name: z
    .string()
    .trim()
    .min(2, "Ingresa al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido")
    .max(255, "El correo no puede superar los 255 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Ingresa 9 números para tu teléfono"),
  interests: z
    .array(z.enum(INTEREST_OPTIONS))
    .min(1, "Selecciona al menos un tipo de vacaciones")
    .max(INTEREST_OPTIONS.length),
  influencer: z.enum(INFLUENCER_OPTIONS, { message: "Selecciona una opción" }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function getChilePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "").slice(0, 9);
}

export function formatChilePhoneNational(phone: string) {
  const digits = getChilePhoneDigits(phone);

  if (digits.length <= 1) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  }

  return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
}

export function formatChilePhone(phone: string) {
  return `+56${getChilePhoneDigits(phone)}`;
}

export const getSlots = createServerFn({ method: "GET" }).handler(async () => {
  const { supabasePublicServer } = await import("@/integrations/supabase/client-public.server");

  const { data, error } = await supabasePublicServer.rpc("get_event_slots_with_counts");

  if (error || !data) {
    throw new Error("No pudimos cargar las campañas. Intenta de nuevo.");
  }

  return data.map((slot): Slot => slotSchema.parse(slot));
});

export const getCyberSlot = createServerFn({ method: "GET" }).handler(async () => {
  const { supabasePublicServer } = await import("@/integrations/supabase/client-public.server");

  const { data, error } = await supabasePublicServer.rpc("get_event_slots_with_counts");

  if (error || !data) {
    throw new Error("No pudimos cargar la campaña Cyber. Intenta de nuevo.");
  }

  const slots = data.map((slot): Slot => slotSchema.parse(slot));
  const cyberSlot = slots.find((slot) => slot.label.toLowerCase().includes("cyber"));

  if (!cyberSlot) {
    return null;
  }

  return cyberSlot;
});

export const registerForSlot = createServerFn({ method: "POST" })
  .inputValidator((data) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabasePublicServer } = await import("@/integrations/supabase/client-public.server");

    const { error } = await supabasePublicServer.rpc("register_for_event_slot", {
      _slot_id: data.slot_id,
      _name: data.name,
      _email: data.email,
      _phone: formatChilePhone(data.phone),
      _interests: data.interests,
      _influencer: data.influencer,
      _campaign: CURRENT_CAMPAIGN,
    });

    if (error) {
      if (error.code === "23505" || error.message.includes("Ya estás registrado")) {
        throw new Error("Ya estás registrado en esta campaña.");
      }
      if (error.message.includes("no tiene cupos")) {
        throw new Error("La campaña seleccionada ya no tiene cupos disponibles.");
      }
      if (error.message.includes("no existe")) {
        throw new Error("La campaña seleccionada no existe.");
      }
      throw new Error("Hubo un error al guardar tu registro. Intenta de nuevo.");
    }

    return { success: true };
  });
