import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface MorphingButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  isSuccess?: boolean;
}

export const MorphingButton = forwardRef<HTMLButtonElement, MorphingButtonProps>(
  ({ isLoading, isSuccess, className, children, disabled, ...props }, ref) => {
    const isActive = isLoading || isSuccess;

    return (
      <div className="flex justify-start w-full">
        <motion.button
          ref={ref}
          layout
          disabled={disabled || isActive}
          className={cn(
            'flex items-center justify-center font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20',
            isActive ? 'rounded-full h-14' : 'rounded-xl h-14 w-full',
            className
          )}
          style={{ width: isActive ? 56 : '100%' }}
          initial={false}
          animate={{
            width: isActive ? 56 : '100%',
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
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
              >
                <Loader2 className="w-6 h-6 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex items-center justify-center whitespace-nowrap"
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
MorphingButton.displayName = 'MorphingButton';
