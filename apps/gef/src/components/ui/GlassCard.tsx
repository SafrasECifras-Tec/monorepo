import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, style, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "gef-card relative overflow-hidden rounded-[2rem] border border-border/70 bg-card backdrop-blur-sm shadow-elevated transition-all duration-300",
        hoverEffect && "hover:-translate-y-1.5 hover:shadow-float hover:border-primary/20",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(180deg, hsl(var(--panel)) 0%, hsl(var(--panel-soft)) 100%)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
