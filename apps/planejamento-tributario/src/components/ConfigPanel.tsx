import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
  icon: React.ReactNode;
  title: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function ConfigPanel({ icon, title, summary, children, defaultOpen = false, className }: ConfigPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("rounded-[1.75rem] border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm overflow-hidden transition-all duration-300", className)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {icon}
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {!open && summary && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 animate-fade-in">{summary}</p>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground/60 transition-transform duration-300",
              open && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <div className="px-5 pb-5 pt-1 border-t border-border/30">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
