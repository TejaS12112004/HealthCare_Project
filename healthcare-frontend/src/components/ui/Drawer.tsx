import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, position = 'right' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const slideDirection = position === 'right' ? 100 : -100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: `${slideDirection}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${slideDirection}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 bottom-0 z-50 w-full max-w-sm bg-surface shadow-soft border-primary/5 flex flex-col',
              position === 'right' ? 'right-0 border-l' : 'left-0 border-r'
            )}
          >
            <div className="flex items-center justify-between p-6 border-b border-ink/5">
              <h2 className="text-xl font-display font-medium text-ink">{title}</h2>
              <IconButton variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5 text-ink/60" />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
