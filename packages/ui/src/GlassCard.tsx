import { forwardRef } from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ hoverEffect = false, className, ...props }, ref) => {
    const classes = [
      "sc-glass-card",
      hoverEffect && "sc-glass-card--hover",
      className,
    ].filter(Boolean).join(" ");

    return <div ref={ref} className={classes} {...props} />;
  }
);

GlassCard.displayName = "GlassCard";
