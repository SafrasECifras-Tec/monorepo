import { forwardRef } from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const ChartContainer = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-chart-container", className].filter(Boolean).join(" ")} {...props} />
  )
);
ChartContainer.displayName = "ChartContainer";

export interface ChartHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export const ChartHeader = forwardRef<HTMLDivElement, ChartHeaderProps>(
  ({ title, subtitle, className, children, ...props }, ref) => (
    <div ref={ref} className={["sc-chart-header", className].filter(Boolean).join(" ")} {...props}>
      {children ?? (
        <>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </>
      )}
    </div>
  )
);
ChartHeader.displayName = "ChartHeader";

export const ChartBody = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-chart-body", className].filter(Boolean).join(" ")} {...props} />
  )
);
ChartBody.displayName = "ChartBody";
