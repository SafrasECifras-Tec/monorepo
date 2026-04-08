import { forwardRef } from "react";

type StatChipVariant = "default" | "success" | "destructive" | "warning";

export interface StatChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatChipVariant;
}

const variantClass: Record<StatChipVariant, string> = {
  default: "sc-stat-chip",
  success: "sc-stat-chip-success",
  destructive: "sc-stat-chip-destructive",
  warning: "sc-stat-chip-warning",
};

export const StatChip = forwardRef<HTMLSpanElement, StatChipProps>(
  ({ variant = "default", className, ...props }, ref) => {
    const classes = [variantClass[variant], className].filter(Boolean).join(" ");
    return <span ref={ref} className={classes} {...props} />;
  }
);

StatChip.displayName = "StatChip";
