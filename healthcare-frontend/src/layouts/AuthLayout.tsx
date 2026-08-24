import { Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HeroCanvas } from '../features/marketing/HeroCanvas';
import { SmoothScroll } from '../lib/motion/SmoothScroll';
import { CustomCursor } from '../components/CustomCursor';

const valueProps = [
  "AI-assisted pre-visit summaries",
  "Automated medication reminders",
  "Smart slot management",
  "Seamless care coordination"
];

export const AuthLayout = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % valueProps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SmoothScroll>
      <CustomCursor />
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        {/* Left Form Panel */}
        <div className="w-full lg:w-[45%] flex flex-col px-8 py-10 md:px-16 justify-between bg-white relative z-10 lg:shadow-[20px_0_40px_rgba(0,0,0,0.05)]">
          <div>
            <Link to="/" className="text-2xl font-bold font-display text-primary flex items-center gap-2 w-fit">
              <motion.div layoutId="logo-text-start" className="w-8 h-8 bg-accent rounded-lg" />
              WellPoint
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto my-12">
            <Outlet />
          </div>

          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} WellPoint. All rights reserved.
          </div>
        </div>

        {/* Right Animated Panel */}
        <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-primary items-center justify-center p-20">
          <div className="absolute inset-0 z-0 opacity-40">
             <HeroCanvas />
          </div>
          
          <div className="relative z-10 w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-4xl font-display font-medium text-white leading-tight"
              >
                {valueProps[index]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SmoothScroll>
  );
};
