import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-accent text-surface hover:bg-accent/90 shadow-soft',
  secondary: 'bg-surface text-accent border border-accent/20 hover:bg-accent/5',
  outline: 'bg-transparent border border-ink/10 text-ink hover:bg-ink/5',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
  destructive: 'bg-danger text-surface hover:bg-danger/90 shadow-soft',
};
const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
