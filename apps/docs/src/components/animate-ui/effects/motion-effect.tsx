"use client";

import * as React from "react";
import { motion, useInView, type UseInViewOptions, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface MotionEffectProps {
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  inViewOnce?: boolean;
  delay?: number;
  blur?: boolean | string;
  slide?: boolean | { direction?: 'up' | 'down' | 'left' | 'right'; offset?: number };
  fade?: boolean | { initialOpacity?: number; opacity?: number };
  zoom?: boolean | { initialScale?: number; scale?: number };
}

function MotionEffect({
  children,
  className,
  transition = { type: 'spring', stiffness: 200, damping: 20 },
  inView = false,
  inViewMargin = "0px",
  inViewOnce = true,
  delay = 0,
  blur = false,
  slide = false,
  fade = false,
  zoom = false,
}: MotionEffectProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: inViewOnce,
    margin: inViewMargin,
  });

  const shouldAnimate = !inView || isInView;

  // Build initial state
  const initial: Record<string, number | string> = {};
  const animate: Record<string, number | string> = {};

  // Handle slide animation
  if (slide) {
    const slideConfig = typeof slide === 'boolean' ? { direction: 'up', offset: 50 } : slide;
    const { direction = 'up', offset = 50 } = slideConfig;
    
    switch (direction) {
      case 'up':
        initial.y = offset;
        animate.y = 0;
        break;
      case 'down':
        initial.y = -offset;
        animate.y = 0;
        break;
      case 'left':
        initial.x = offset;
        animate.x = 0;
        break;
      case 'right':
        initial.x = -offset;
        animate.x = 0;
        break;
    }
  }

  // Handle fade animation
  if (fade) {
    const fadeConfig = typeof fade === 'boolean' ? { initialOpacity: 0, opacity: 1 } : fade;
    const { initialOpacity = 0, opacity = 1 } = fadeConfig;
    initial.opacity = initialOpacity;
    animate.opacity = opacity;
  }

  // Handle zoom animation
  if (zoom) {
    const zoomConfig = typeof zoom === 'boolean' ? { initialScale: 0.8, scale: 1 } : zoom;
    const { initialScale = 0.8, scale = 1 } = zoomConfig;
    initial.scale = initialScale;
    animate.scale = scale;
  }

  // Handle blur animation
  if (blur) {
    const blurValue = typeof blur === 'boolean' ? '4px' : blur;
    initial.filter = `blur(${blurValue})`;
    animate.filter = 'blur(0px)';
  }

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={shouldAnimate ? animate : initial}
      transition={{
        ...transition,
        delay: delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export { MotionEffect, type MotionEffectProps };