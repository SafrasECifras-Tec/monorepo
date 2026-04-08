import { forwardRef } from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const DataPanel = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-data-panel", className].filter(Boolean).join(" ")} {...props} />
  )
);
DataPanel.displayName = "DataPanel";

export const DataPanelHeader = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-data-panel-header", className].filter(Boolean).join(" ")} {...props} />
  )
);
DataPanelHeader.displayName = "DataPanelHeader";

export const DataPanelBody = forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={["sc-data-panel-body", className].filter(Boolean).join(" ")} {...props} />
  )
);
DataPanelBody.displayName = "DataPanelBody";
