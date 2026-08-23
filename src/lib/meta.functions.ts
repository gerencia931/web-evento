import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const capiSchema = z.object({
  event_name: z.enum(["PageView", "Lead"]),
  event_id: z.string().min(1),
  event_source_url: z.string().url().optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
});

const DEFAULT_META_PIXEL_ID = "2402952336565045";
const DEFAULT_META_GRAPH_API_VERSION = "v26.0";

export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => capiSchema.parse(data))
  .handler(async ({ data }) => {
    const pixelId =
      process.env["META_PIXEL_ID"] || process.env["VITE_META_PIXEL_ID"] || DEFAULT_META_PIXEL_ID;
    const token = process.env["META_CAPI_ACCESS_TOKEN"];
    const graphApiVersion = process.env["META_GRAPH_API_VERSION"] || DEFAULT_META_GRAPH_API_VERSION;
    const testEventCode = process.env["META_TEST_EVENT_CODE"];
    if (!pixelId || !token)
      return { ok: false as const, reason: "missing_meta_credentials" as const };

    const enc = async (value?: string) => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      if (!normalized) return undefined;
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };

    const user_data: Record<string, unknown> = {};
    const em = await enc(data.email);
    const ph = await enc(data.phone?.replace(/[^\d]/g, ""));
    const fn = await enc(data.name?.split(" ")[0]);
    if (em) user_data["em"] = [em];
    if (ph) user_data["ph"] = [ph];
    if (fn) user_data["fn"] = [fn];
    if (data.fbp) user_data["fbp"] = data.fbp;
    if (data.fbc) user_data["fbc"] = data.fbc;

    const ip =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestIP({ xForwardedFor: true });
    const ua = getRequestHeader("user-agent");
    if (ip) user_data["client_ip_address"] = ip;
    if (ua) user_data["client_user_agent"] = ua;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: data.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: data.event_id,
          event_source_url: data.event_source_url,
          action_source: "website",
          user_data,
        },
      ],
    };

    if (testEventCode) payload["test_event_code"] = testEventCode;

    const res = await fetch(`https://graph.facebook.com/${graphApiVersion}/${pixelId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Meta CAPI error", res.status, await res.text());
      return { ok: false as const };
    }
    return { ok: true as const };
  });
