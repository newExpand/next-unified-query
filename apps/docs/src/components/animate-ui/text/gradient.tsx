"use client";

import * as React from "react";
import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  text: string;
  className?: string;
  transition?: Transition;
  gradient?: string;
  neon?: boolean;
}

function GradientText({
  text,
  className,
  transition = { duration: 50, repeat: Infinity, ease: 'linear' },
  gradient = "linear-gradient(90deg, #3b82f6 0%, #a855f7 20%, #ec4899 50%, #a855f7 80%, #3b82f6 100%)",
  neon = false,
}: GradientTextProps) {
  const textStyle = {
    backgroundImage: gradient,
    backgroundSize: "200% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    ...(neon && {
      textShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
    }),
  };

  return (
    <motion.span
      className={cn("inline-block", className)}
      style={textStyle}
      animate={{
        backgroundPosition: ["0% 50%", "200% 50%"],
      }}
      transition={transition}
    >
      {text}
    </motion.span>
  );
}

export { GradientText, type GradientTextProps };