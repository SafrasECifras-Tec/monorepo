import { forwardRef } from "react";

export const PageShell = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-page-shell", className].filter(Boolean).join(" ")} {...props} />
  )
);

PageShell.displayName = "PageShell";
