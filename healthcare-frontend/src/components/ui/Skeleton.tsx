import { cn } from '../../lib/utils';
import { useReducedMotion } from 'framer-motion';

export const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <div
      className={cn(
        "rounded-md bg-slate-800 relative overflow-hidden",
        !shouldReduceMotion && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
