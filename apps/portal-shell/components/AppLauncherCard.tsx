"use client";

import { ExternalLink } from "lucide-react";
import { buildAppUrl } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

type ColorScheme = "green" | "teal";

/**
 * "supabase" → appends #access_token=… hash so the Supabase JS client in the
 *              target app picks up the session automatically on page load.
 *              (Supabase detectSessionInUrl: true is the default.)
 *
 * "google"   → no hash needed; Google's own browser session handles SSO
 *              natively when the user clicks "Sign in with Google" in the app.
 */
type SsoType = "supabase" | "google";

interface AppLauncherCardProps {
  name: string;
  fullName: string;
  description: string;
  href: string;
  currentTenantId: string | null;
  colorScheme: ColorScheme;
  /** Controls the SSO strategy when opening the app in a new tab. */
  ssoType?: SsoType;
}

const colorMap: Record<ColorScheme, string> = {
  green: "from-[hsl(151_56%_28%)] to-[hsl(160_46%_36%)]",
  teal: "from-[hsl(194_58%_36%)] to-[hsl(194_58%_46%)]",
};

export function AppLauncherCard({
  name,
  fullName,
  description,
  href,
  currentTenantId,
  colorScheme,
  ssoType,
}: AppLauncherCardProps) {
  const { session } = useAuth();

  /**
   * Builds the final URL to open in the new tab:
   *
   * 1. Applies fazenda_id as a query param (for tenant context).
   * 2. For ssoType="supabase": appends the current Supabase session tokens
   *    in the URL hash. The target app's Supabase client reads the hash on
   *    initialization and calls setSession() — user is instantly logged in.
   *
   * Note: URL fragments (#) are never sent to servers (HTTP spec), so the
   * tokens stay in the browser only. On custom domain migration, remove
   * this hash entirely — shared cookies will handle SSO natively.
   */
  function buildLaunchUrl(): string {
    const base = buildAppUrl(href, currentTenantId);

    if (
      ssoType === "supabase" &&
      session?.access_token &&
      session?.refresh_token
    ) {
      const remainingSecs = session.expires_at
        ? Math.max(0, Math.floor(session.expires_at - Date.now() / 1000))
        : (session.expires_in ?? 3600);

      const hashParams = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: String(remainingSecs),
        token_type: "bearer",
        type: "magiclink", // triggers SIGNED_IN in onAuthStateChange
      });

      return `${base}#${hashParams.toString()}`;
    }

    return base;
  }

  return (
    <a
      href={buildLaunchUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-card",
        "backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-float hover:border-primary/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      )}
    >
      <div className="flex items-start gap-4">
        {/* App icon badge */}
        <div
          className={cn(
            "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-card",
            colorMap[colorScheme]
          )}
        >
          <span className="text-lg font-black text-white tracking-tight">
            {name}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{fullName}</h2>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
          {currentTenantId && (
            <p className="text-[10px] text-primary/70 font-semibold mt-2.5 uppercase tracking-[0.16em]">
              Fazenda selecionada ·{" "}
              <span className="normal-case font-normal">pronta para usar</span>
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
