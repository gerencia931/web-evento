import { sendMetaEvent } from "./meta.functions";

export const META_PIXEL_ID = import.meta.env["VITE_META_PIXEL_ID"] || "2402952336565045";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown };
  }
}

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2] ? decodeURIComponent(match[2]) : undefined;
}

export function newEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type UserData = {
  email?: string | undefined;
  phone?: string | undefined;
  name?: string | undefined;
};

/** Fires the event in the browser pixel and via CAPI using the same event_id (deduplication). */
export async function trackMeta(
  eventName: "PageView" | "Lead",
  user: UserData = {},
  eventId = newEventId(),
) {
  if (typeof window === "undefined") return;

  try {
    window.fbq?.("track", eventName, {}, { eventID: eventId });
  } catch {
    /* pixel blocked */
  }

  try {
    await sendMetaEvent({
      data: {
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        ...user,
      },
    });
  } catch {
    /* never break the UI on tracking failures */
  }
}
