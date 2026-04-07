import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabNav({ tabs, activeTab, onChange, className }: TabNavProps) {
  return (
    <div className={cn('flex overflow-x-auto pb-2 -mb-2', className)}>
      <div className="p-1 flex items-center gap-1 w-fit bg-card/70 border border-border/60 shadow-soft rounded-full shrink-0 backdrop-blur-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-full font-semibold transition-all duration-200 text-sm whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-card text-primary shadow-soft border border-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
