import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { IconButton } from '../components/ui/IconButton';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative overflow-hidden bg-surface border border-ink/5 shadow-soft rounded-xl p-4 pr-12 w-80 flex items-start gap-3"
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-danger" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-accent" />}
              </div>
              <div className="flex-1 text-sm font-body font-medium text-ink">
                {t.message}
              </div>
              <IconButton 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-2 h-8 w-8 text-ink/40 hover:text-ink/80" 
                onClick={() => removeToast(t.id)}
              >
                <X className="w-4 h-4" />
              </IconButton>
              
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${
                  t.type === 'success' ? 'bg-success' : t.type === 'error' ? 'bg-danger' : 'bg-accent'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
