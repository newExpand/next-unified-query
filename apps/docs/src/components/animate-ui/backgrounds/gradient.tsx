"use client";

import * as React from "react";
import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface GradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  transition?: Transition;
}

function GradientBackground({
  children,
  className,
  transition = { duration: 15, ease: 'easeInOut', repeat: Infinity },
}: GradientBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/20"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={transition}
        style={{
          backgroundSize: "200% 200%",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10"
        animate={{
          backgroundPosition: ["100% 100%", "0% 0%", "100% 100%"],
        }}
        transition={{
          ...transition,
          delay: 5,
        }}
        style={{
          backgroundSize: "200% 200%",
        }}
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export { GradientBackground, type GradientBackgroundProps };