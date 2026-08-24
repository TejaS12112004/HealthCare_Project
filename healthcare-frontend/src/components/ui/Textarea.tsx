import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, value, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <motion.div 
        className="w-full mb-2"
        animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-full">
          <textarea
            ref={ref}
            id={inputId}
            className={cn(
              'peer w-full min-h-[100px] rounded-lg border bg-transparent px-4 pt-6 pb-2 text-ink font-body transition-all duration-150 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              error ? 'border-danger focus:ring-danger/50 focus:border-danger' : 'border-ink/10 hover:border-ink/20',
              className
            )}
            placeholder=" " // Required for peer-placeholder-shown
            value={value}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform font-body text-ink/50 duration-150 pointer-events-none',
              'peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100',
              'peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-accent',
              error && 'text-danger peer-focus:text-danger'
            )}
          >
            {label}
          </label>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs font-medium text-danger mt-1.5 ml-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
Textarea.displayName = 'Textarea';
