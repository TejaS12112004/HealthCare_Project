import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import React, { useRef } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, stagger, className }) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger || 0,
        delayChildren: delay
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

export const RevealItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };
  return <motion.div variants={itemVariants} className={className}>{children}</motion.div>;
};
