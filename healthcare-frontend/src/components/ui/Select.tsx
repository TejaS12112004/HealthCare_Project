import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, options, ...props }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <motion.div 
        className="w-full mb-2"
        animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'peer w-full h-14 rounded-lg border bg-transparent px-4 pt-4 pb-1 text-ink font-body transition-all duration-150 appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              error ? 'border-danger focus:ring-danger/50 focus:border-danger' : 'border-ink/10 hover:border-ink/20',
              className
            )}
            {...props}
          >
            <option value="" disabled hidden></option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40 pointer-events-none" />
          <label
            htmlFor={selectId}
            className={cn(
              'absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform font-body text-ink/50 duration-150 pointer-events-none',
              'peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100',
              'peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-accent',
              /* Because selects don't use placeholder shown properly, we always keep the label floated */
              'translate-y-[-0.75rem] scale-75',
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
Select.displayName = 'Select';
