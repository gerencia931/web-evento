type RuntimeEnv = Record<string, string | undefined>;

export function getRuntimeEnv(): RuntimeEnv {
  const globalWithProcess = globalThis as typeof globalThis & {
    process?: { env?: RuntimeEnv };
  };

  return globalWithProcess.process?.env ?? {};
}

export function getSupabasePublicEnv() {
  const runtimeEnv = getRuntimeEnv();
  const viteEnv = import.meta.env;

  const url =
    viteEnv["VITE_SUPABASE_URL"] || runtimeEnv["SUPABASE_URL"] || runtimeEnv["VITE_SUPABASE_URL"];

  const publishableKey =
    viteEnv["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    viteEnv["VITE_SUPABASE_ANON_KEY"] ||
    runtimeEnv["SUPABASE_PUBLISHABLE_KEY"] ||
    runtimeEnv["SUPABASE_ANON_KEY"] ||
    runtimeEnv["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    runtimeEnv["VITE_SUPABASE_ANON_KEY"];

  return { url, publishableKey };
}

export function getMissingSupabasePublicEnvMessage(url?: string, publishableKey?: string) {
  const missing = [
    ...(!url ? ["VITE_SUPABASE_URL"] : []),
    ...(!publishableKey ? ["VITE_SUPABASE_PUBLISHABLE_KEY"] : []),
  ];

  return `Missing Supabase environment variable(s): ${missing.join(
    ", ",
  )}. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).`;
}
