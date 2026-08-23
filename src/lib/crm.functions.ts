import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const STATUSES = ["nuevo", "contactado", "confirmado", "asistio", "cancelado"] as const;

export type RegistrationStatus = (typeof STATUSES)[number];

export type CrmRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: RegistrationStatus;
  notes: string | null;
  created_at: string;
  slot_id: string;
  slot_label: string;
  interests: string[];
  influencer: string | null;
};

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error("No pudimos verificar tus permisos.");
    return { isAdmin: Boolean(data), userId: context.userId };
  });

/** Bootstrap: the first signed-in user can claim admin when nobody has it yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");

    if (error) {
      if (error.message.includes("Ya existe un administrador")) {
        throw new Error("Ya existe un administrador en el sistema.");
      }
      throw new Error("No pudimos asignarte el rol de administrador.");
    }

    return { success: Boolean(data) };
  });

export const listRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CrmRegistration[]> => {
    const { data, error } = await context.supabase
      .from("event_registrations")
      .select(
        "id, name, email, phone, status, notes, created_at, slot_id, interests, influencer, event_slots(label)",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error("No pudimos cargar los contactos.");

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const slot = r["event_slots"] as { label?: string } | null;
      return {
        id: String(r["id"]),
        name: String(r["name"] ?? ""),
        email: String(r["email"] ?? ""),
        phone: (r["phone"] as string | null) ?? null,
        status: (r["status"] as RegistrationStatus) ?? "nuevo",
        notes: (r["notes"] as string | null) ?? null,
        created_at: String(r["created_at"] ?? ""),
        slot_id: String(r["slot_id"] ?? ""),
        slot_label: slot?.label ?? "—",
        interests: Array.isArray(r["interests"]) ? (r["interests"] as string[]) : [],
        influencer: (r["influencer"] as string | null) ?? null,
      };
    });
  });

export const updateRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        notes: z.string().max(2000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch: { status?: RegistrationStatus; notes?: string | null } = {};
    if (data.status) patch["status"] = data.status;
    if (data.notes !== undefined) patch["notes"] = data.notes;

    const { error } = await context.supabase
      .from("event_registrations")
      .update(patch)
      .eq("id", data.id);

    if (error) throw new Error("No pudimos actualizar el contacto.");
    return { success: true };
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("event_registrations").delete().eq("id", data.id);
    if (error) throw new Error("No pudimos eliminar el contacto.");
    return { success: true };
  });
