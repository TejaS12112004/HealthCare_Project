import { useEffect, useState } from 'react';
import { motion, useSpring, useReducedMotion } from 'framer-motion';

export const CustomCursor = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [cursorVariant, setCursorVariant] = useState('default');

  const cursorX = useSpring(0, { stiffness: 300, damping: 30, mass: 0.5 });
  const cursorY = useSpring(0, { stiffness: 300, damping: 30, mass: 0.5 });
  
  const dotX = useSpring(0, { stiffness: 1000, damping: 40, mass: 0.1 });
  const dotY = useSpring(0, { stiffness: 1000, damping: 40, mass: 0.1 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice || window.innerWidth < 1024) return;

    setIsVisible(true);
    
    // Hide native cursor globally
    document.body.style.cursor = 'none';

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 18);
      cursorY.set(e.clientY - 18);
      
      dotX.set(e.clientX - 4);
      dotY.set(e.clientY - 4);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorType = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      
      if (cursorType) {
        setCursorVariant(cursorType);
      } else if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        setCursorVariant('hover');
      } else {
        setCursorVariant('default');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY, dotX, dotY, prefersReducedMotion]);

  if (!isVisible) return null;

  const variants = {
    default: {
      scale: 1,
      borderColor: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'transparent',
      borderRadius: '50%'
    },
    hover: {
      scale: 1.6,
      borderColor: 'var(--color-accent)', // teal accent
      backgroundColor: 'transparent',
      borderRadius: '50%'
    },
    text: {
      scaleY: 1.5,
      scaleX: 0.2,
      borderColor: 'rgba(255, 255, 255, 1)',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderRadius: '2px'
    }
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-9 h-9 border pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          mixBlendMode: 'difference',
        }}
        variants={variants}
        animate={cursorVariant}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999]"
        style={{
          x: dotX,
          y: dotY,
          mixBlendMode: 'difference',
        }}
        animate={{
          opacity: cursorVariant === 'text' ? 0 : 1
        }}
      />
    </>
  );
};
