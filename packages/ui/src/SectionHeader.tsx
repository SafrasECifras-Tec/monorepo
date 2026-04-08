import { forwardRef } from "react";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  subtitle?: string;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ icon: Icon, title, subtitle, className, children, ...props }, ref) => {
    const classes = ["sc-section-header", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {Icon && (
          <div className="sc-section-icon">
            <Icon className="sc-section-icon-svg" />
          </div>
        )}
        {children ?? (
          <div>
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";
