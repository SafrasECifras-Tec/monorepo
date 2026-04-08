import { forwardRef } from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const HeroBoard = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-hero-board", className].filter(Boolean).join(" ")} {...props} />
  )
);
HeroBoard.displayName = "HeroBoard";

export const HeroCopy = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-hero-copy", className].filter(Boolean).join(" ")} {...props} />
  )
);
HeroCopy.displayName = "HeroCopy";

export interface HeroInsightProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
}

export const HeroInsight = forwardRef<HTMLDivElement, HeroInsightProps>(
  ({ label, value, sub, className, children, ...props }, ref) => (
    <div ref={ref} className={["sc-hero-insight", className].filter(Boolean).join(" ")} {...props}>
      {children ?? (
        <>
          {label && <span className="sc-hero-insight-label">{label}</span>}
          {value && <span className="sc-hero-insight-value">{value}</span>}
          {sub && <span className="sc-hero-insight-sub">{sub}</span>}
        </>
      )}
    </div>
  )
);
HeroInsight.displayName = "HeroInsight";
