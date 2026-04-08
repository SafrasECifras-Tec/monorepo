import { forwardRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabNavProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const TabNav = forwardRef<HTMLDivElement, TabNavProps>(
  ({ tabs, activeTab, onChange, className, ...props }, ref) => {
    const classes = ["sc-tab-nav-wrapper", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        <div className="sc-tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={
                activeTab === tab.id
                  ? "sc-tab-nav-item sc-tab-nav-item-active"
                  : "sc-tab-nav-item"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

TabNav.displayName = "TabNav";
