import { ExternalLink } from "lucide-react";
import { buildAppUrl } from "@/lib/tenant";
import { cn } from "@/lib/utils";

type ColorScheme = "green" | "teal";

interface AppLauncherCardProps {
  name: string;
  fullName: string;
  description: string;
  href: string;
  currentTenantId: string | null;
  colorScheme: ColorScheme;
}

const colorMap: Record<ColorScheme, string> = {
  green: "from-[hsl(151_56%_28%)] to-[hsl(160_46%_36%)]",
  teal: "from-[hsl(194_58%_36%)] to-[hsl(194_58%_46%)]",
};

// Server Component — no client-side hooks needed; links are plain <a> tags
export function AppLauncherCard({
  name,
  fullName,
  description,
  href,
  currentTenantId,
  colorScheme,
}: AppLauncherCardProps) {
  const resolvedUrl = buildAppUrl(href, currentTenantId);

  return (
    <a
      href={resolvedUrl}
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
