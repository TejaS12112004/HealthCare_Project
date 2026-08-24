import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink/40" />
      </div>
      <h3 className="text-lg font-display font-medium text-ink mb-2">{title}</h3>
      {description && <p className="text-sm font-body text-ink/60 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
