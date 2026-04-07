import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient {
  if (client) return client;

  const url = config?.url ?? (import.meta as any).env?.VITE_SUPABASE_URL;
  const key =
    config?.anonKey ?? (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and anon key are required. " +
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY env vars, " +
        "or pass config explicitly."
    );
  }

  client = createClient(url, key, {
    auth: {
      storage:
        typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}
