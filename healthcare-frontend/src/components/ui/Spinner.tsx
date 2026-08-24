import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div
    className={cn(
      'animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500',
      sizeMap[size],
      className,
    )}
  />
);
