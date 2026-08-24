import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('hasLoaded');
    if (hasLoaded) {
      setIsLoading(false);
      return;
    }

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 150);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('hasLoaded', 'true');
    }, 1600); // Max 1.6s

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const word = "WellPoint";
  const letters = word.split("");

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background"
        >
          <div className="flex overflow-hidden">
            {letters.map((letter, index) => (
              <motion.span
                key={index}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.25, 0.1, 0.25, 1.0],
                }}
                className="text-4xl md:text-6xl font-display font-bold text-primary tracking-tight"
                layoutId={index === 0 ? "logo-text-start" : undefined}
              >
                {letter}
              </motion.span>
            ))}
          </div>
          
          <div className="w-48 h-[2px] bg-primary/10 mt-8 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
