import { createClient } from "@supabase/supabase-js";
import { getMissingSupabasePublicEnvMessage, getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabasePublicServerClient() {
  const { url, publishableKey } = getSupabasePublicEnv();

  if (!url || !publishableKey) {
    const message = getMissingSupabasePublicEnvMessage(url, publishableKey);
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(url, publishableKey, {
    global: {
      fetch: createSupabaseFetch(publishableKey),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabasePublicServer: ReturnType<typeof createSupabasePublicServerClient> | undefined;

export const supabasePublicServer = new Proxy(
  {} as ReturnType<typeof createSupabasePublicServerClient>,
  {
    get(_, prop, receiver) {
      if (!_supabasePublicServer) _supabasePublicServer = createSupabasePublicServerClient();
      return Reflect.get(_supabasePublicServer, prop, receiver);
    },
  },
);
