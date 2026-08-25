import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, id, type, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <motion.div 
        className="w-full mb-2"
        animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'peer w-full h-14 rounded-xl border bg-transparent px-4 pt-4 pb-1 text-ink font-body transition-all duration-150',
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

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 focus:outline-none"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showPassword ? 'hide' : 'show'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          )}
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
FloatingInput.displayName = 'FloatingInput';
