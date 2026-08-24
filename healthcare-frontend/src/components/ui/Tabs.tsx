import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className, layoutId = 'active-tab' }) => {
  return (
    <div className={cn('flex space-x-1 bg-surface-hover p-1 rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex-1 px-4 py-2 text-sm font-medium font-body rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 z-10',
              isActive ? 'text-surface' : 'text-ink/60 hover:text-ink hover:bg-ink/5'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-accent rounded-lg -z-10 shadow-soft"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
