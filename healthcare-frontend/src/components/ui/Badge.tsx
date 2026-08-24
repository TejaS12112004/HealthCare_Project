import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'neutral' 
  | 'accent' 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'RESCHEDULED'
  | 'HOLD'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | (string & {});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, children, ...props }) => {
  let mappedVariant = variant;
  if (variant === 'PENDING' || variant === 'MEDIUM' || variant === 'HOLD') mappedVariant = 'warning';
  if (variant === 'CONFIRMED' || variant === 'RESCHEDULED') mappedVariant = 'accent';
  if (variant === 'COMPLETED' || variant === 'LOW') mappedVariant = 'success';
  if (variant === 'CANCELLED' || variant === 'HIGH') mappedVariant = 'danger';

  const variants: Record<string, string> = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    neutral: 'bg-ink/5 text-ink/70 border-ink/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-body font-bold border transition-colors',
        variants[mappedVariant] || variants.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
