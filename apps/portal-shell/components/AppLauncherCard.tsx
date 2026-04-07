"use client";

import { Lock, ExternalLink, ArrowRight } from "lucide-react";
import { buildAppUrl } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import type { ReactNode } from "react";

type SsoType = "supabase" | "google";

interface AppLauncherCardProps {
  /** Short module label shown above the title */
  tag: string;
  /** Full module name */
  title: string;
  /** Module description */
  description: string;
  /** Lucide icon rendered inside the accent circle */
  icon: ReactNode;
  /** Gradient classes for the accent circle + top border glow */
  accentGradient: string;
  /** Accent color for the tag text and hover border */
  accentColor: string;
  /** Base URL to open */
  href?: string;
  currentTenantId: string | null;
  /** Controls SSO strategy */
  ssoType?: SsoType;
  /** When true, shows lock overlay and disables interaction */
  locked?: boolean;
}

export function AppLauncherCard({
  tag,
  title,
  description,
  icon,
  accentGradient,
  accentColor,
  href,
  currentTenantId,
  ssoType,
  locked = false,
}: AppLauncherCardProps) {
  const { session } = useAuth();

  function buildLaunchUrl(): string {
    if (!href) return "#";
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
        // no "type" — avoids triggering SIGNED_IN during Supabase module init
        // (before React mounts), which caused useState null crash in PLT
      });

      return `${base}#${hashParams.toString()}`;
    }

    return base;
  }

  const Wrapper = locked ? "div" : "a";
  const wrapperProps = locked
    ? {}
    : {
        href: buildLaunchUrl(),
        target: "_blank" as const,
        rel: "noopener noreferrer" as const,
      };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300",
        locked
          ? "border-border/40 bg-card/40 cursor-default"
          : [
              "border-border/60 bg-card/90 shadow-card",
              "hover:-translate-y-1 hover:shadow-float hover:border-transparent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            ]
      )}
    >
      {/* Top accent line */}
      <div
        className={cn(
          "h-1 w-full",
          locked ? "bg-muted-foreground/10" : `bg-gradient-to-r ${accentGradient}`
        )}
      />

      <div className="flex flex-col flex-1 p-6">
        {/* Icon + Tag row */}
        <div className="flex items-center justify-between mb-5">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300",
              locked
                ? "bg-muted/60"
                : `bg-gradient-to-br ${accentGradient} group-hover:scale-105`
            )}
          >
            <div className={cn("h-5 w-5", locked ? "text-muted-foreground/40" : "text-white")}>
              {icon}
            </div>
          </div>

          {locked ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50 bg-muted/50 px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Em breve
            </span>
          ) : (
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.16em]",
                accentColor
              )}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Title + Description */}
        <h2
          className={cn(
            "text-[1.05rem] font-bold tracking-tight leading-snug",
            locked ? "text-muted-foreground/40" : "text-foreground"
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "text-[13px] leading-relaxed mt-1.5 flex-1",
            locked ? "text-muted-foreground/30" : "text-muted-foreground"
          )}
        >
          {description}
        </p>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-border/50">
          {locked ? (
            <span className="text-[11px] text-muted-foreground/30 font-medium">
              Módulo em desenvolvimento
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[12px] font-semibold transition-all duration-200",
                accentColor,
                "group-hover:gap-2.5"
              )}
            >
              Acessar módulo
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>

      {/* Locked overlay shimmer */}
      {locked && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-transparent to-muted/20" />
      )}
    </Wrapper>
  );
}
