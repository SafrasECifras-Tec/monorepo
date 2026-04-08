import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

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
    <div className={cn('flex overflow-x-auto pb-2 -mb-2 custom-scrollbar', className)}>
      <GlassCard className="p-1 flex items-center gap-1 w-fit bg-white/60 border border-slate-200/60 shadow-sm rounded-xl shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'bg-white text-[#059669] shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            )}
          >
            {tab.label}
          </button>
        ))}
      </GlassCard>
    </div>
  );
}
