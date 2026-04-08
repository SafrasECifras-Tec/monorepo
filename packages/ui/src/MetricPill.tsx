import { forwardRef } from "react";

type MetricPillVariant = "default" | "accent" | "negative";

export interface MetricPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MetricPillVariant;
  label?: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
}

const variantClass: Record<MetricPillVariant, string> = {
  default: "sc-metric-pill",
  accent: "sc-metric-pill-accent",
  negative: "sc-metric-pill-negative",
};

export const MetricPill = forwardRef<HTMLDivElement, MetricPillProps>(
  ({ variant = "default", label, value, sub, className, children, ...props }, ref) => {
    const classes = [variantClass[variant], className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {children ?? (
          <>
            {label && <span className="sc-metric-label">{label}</span>}
            {value && <span className="sc-metric-value">{value}</span>}
            {sub && <span className="sc-metric-sub">{sub}</span>}
          </>
        )}
      </div>
    );
  }
);

MetricPill.displayName = "MetricPill";
