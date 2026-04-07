import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  /**
   * When set, persists the Supabase session in cookies with this domain
   * instead of localStorage. Use ".sociosdoagro.com.br" in production
   * so ALL subdomains share the same auth cookie automatically — no SSO
   * workarounds needed once a custom domain is configured.
   *
   * @example ".sociosdoagro.com.br"   // prod: share across subdomains
   * @example undefined                 // dev: use localStorage (default)
   */
  cookieDomain?: string;
}

// ── Cookie storage adapter ────────────────────────────────────────────────────
// Supabase sessions can exceed 4 KB (compressed JWT + metadata), so we split
// large values into 3500-char chunks — same strategy as @supabase/ssr.
// Single-chunk values → stored as `${key}`
// Multi-chunk values  → stored as `${key}.0`, `${key}.1`, …
const CHUNK_SIZE = 3500;

function createCookieStorage(domain: string): Storage {
  function readAll(): Record<string, string> {
    if (typeof document === "undefined") return {};
    return Object.fromEntries(
      document.cookie
        .split("; ")
        .filter(Boolean)
        .map((pair) => {
          const eq = pair.indexOf("=");
          return [pair.slice(0, eq), decodeURIComponent(pair.slice(eq + 1))];
        })
    );
  }

  function writeCookie(name: string, value: string): void {
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; domain=${domain}; max-age=${maxAge}; SameSite=Lax`;
  }

  function deleteCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; domain=${domain}; max-age=0; SameSite=Lax`;
  }

  return {
    getItem(key: string): string | null {
      const all = readAll();
      if (key in all) return all[key]!;
      // Reassemble chunks
      const chunks: string[] = [];
      for (let i = 0; `${key}.${i}` in all; i++) chunks.push(all[`${key}.${i}`]!);
      return chunks.length > 0 ? chunks.join("") : null;
    },

    setItem(key: string, value: string): void {
      this.removeItem(key); // clear stale chunks first
      if (value.length <= CHUNK_SIZE) {
        writeCookie(key, value);
      } else {
        let i = 0;
        for (let off = 0; off < value.length; off += CHUNK_SIZE) {
          writeCookie(`${key}.${i++}`, value.slice(off, off + CHUNK_SIZE));
        }
      }
    },

    removeItem(key: string): void {
      const all = readAll();
      deleteCookie(key);
      for (let i = 0; `${key}.${i}` in all; i++) deleteCookie(`${key}.${i}`);
    },

    // Required by the Storage interface but unused by Supabase
    clear(): void {},
    key(_index: number): string | null { return null; },
    get length(): number { return 0; },
  };
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

  const storage = config?.cookieDomain
    ? createCookieStorage(config.cookieDomain)
    : typeof window !== "undefined"
      ? window.localStorage
      : undefined;

  client = createClient(url, key, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}
