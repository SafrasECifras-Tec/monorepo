import { createBrowserClient } from "@supabase/ssr";

const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    COOKIE_DOMAIN
      ? {
          cookieOptions: {
            domain: COOKIE_DOMAIN,
            path: "/",
            sameSite: "lax" as const,
            secure: true,
          },
        }
      : undefined
  );
}
