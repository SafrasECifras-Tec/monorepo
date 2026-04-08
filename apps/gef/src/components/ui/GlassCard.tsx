import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-sm transition-all duration-300",
        hoverEffect && "hover:bg-white/70 hover:shadow-md hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {/* Optional: Noise texture or subtle gradient overlay could go here */}
      {children}
    </div>
  );
}
