import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface AsyncButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  isSuccess?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20',
};

export const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(
  ({ isLoading, isSuccess, variant = 'primary', className, children, disabled, ...props }, ref) => {
    const isActive = isLoading || isSuccess;

    return (
      <div className="flex justify-start w-full">
        <motion.button
          ref={ref}
          layout
          disabled={disabled || isActive}
          className={cn(
            'flex items-center justify-center font-medium transition-colors',
            isActive ? 'rounded-full h-10 w-10 p-0' : 'rounded-lg h-10 px-4 w-full',
            variants[variant],
            className
          )}
          style={{ width: isActive ? 40 : '100%' }}
          initial={false}
          animate={{
            width: isActive ? 40 : '100%',
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
          {...props}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.polyline
                    points="20 6 9 17 4 12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </svg>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-center whitespace-nowrap gap-2"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }
);
AsyncButton.displayName = 'AsyncButton';
