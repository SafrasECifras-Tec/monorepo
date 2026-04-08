import { forwardRef } from "react";

export const ConfigBar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-config-bar", className].filter(Boolean).join(" ")} {...props} />
  )
);

ConfigBar.displayName = "ConfigBar";
