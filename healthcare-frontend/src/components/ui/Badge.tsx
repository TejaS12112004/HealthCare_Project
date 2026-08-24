import { cn } from '../../lib/utils';
import type { AppointmentStatus, UrgencyLevel } from '../../types/appointment';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | AppointmentStatus | UrgencyLevel;

const variantMap: Record<string, string> = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  danger: 'bg-red-900/50 text-red-400 border border-red-800',
  info: 'bg-indigo-900/50 text-indigo-400 border border-indigo-800',
  // Appointment statuses
  PENDING: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  CONFIRMED: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  CANCELLED: 'bg-red-900/50 text-red-400 border border-red-800',
  COMPLETED: 'bg-slate-700 text-slate-300 border border-slate-600',
  RESCHEDULED: 'bg-indigo-900/50 text-indigo-400 border border-indigo-800',
  // Urgency levels
  LOW: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
  MEDIUM: 'bg-amber-900/50 text-amber-400 border border-amber-800',
  HIGH: 'bg-red-900/50 text-red-400 border border-red-800',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantMap[variant as string] ?? variantMap.default,
      className,
    )}
  >
    {children}
  </span>
);
