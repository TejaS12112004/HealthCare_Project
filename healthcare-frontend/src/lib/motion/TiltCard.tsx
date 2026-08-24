import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const TiltCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const rotateY = ((mouseX - width / 2) / (width / 2)) * 6;
    const rotateX = ((height / 2 - mouseY) / (height / 2)) * 6;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={prefersReducedMotion ? {} : {
        rotateX: rotate.x,
        rotateY: rotate.y,
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered 
          ? "0 25px 30px -5px rgb(11 18 32 / 0.05)" 
          : "0 10px 15px -3px rgb(11 18 32 / 0.03)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
