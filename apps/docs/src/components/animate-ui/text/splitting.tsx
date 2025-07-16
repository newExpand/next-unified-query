"use client";

import * as React from "react";
import { motion, useInView, type Variants, type UseInViewOptions } from "motion/react";
import { cn } from "@/lib/utils";

interface SplittingTextProps {
  className?: string;
  text: string | string[];
  type?: 'chars' | 'words' | 'lines';
  motionVariants?: Variants;
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  inViewOnce?: boolean;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function SplittingText({
  className,
  text,
  type = 'chars',
  motionVariants = defaultVariants,
  inView = false,
  inViewMargin = "0px",
  inViewOnce = true,
}: SplittingTextProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: inViewOnce,
    margin: inViewMargin,
  });

  const shouldAnimate = !inView || isInView;

  const textArray = Array.isArray(text) ? text : [text];
  
  const splitText = (str: string) => {
    switch (type) {
      case 'words':
        return str.split(' ');
      case 'lines':
        return str.split('\n');
      case 'chars':
      default:
        return str.split('');
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: type === 'chars' ? 0.02 : type === 'words' ? 0.1 : 0.2,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
    >
      {textArray.map((textItem, textIndex) => (
        <div key={textIndex} className="inline-block">
          {splitText(textItem).map((item, index) => (
            <motion.span
              key={index}
              className="inline-block"
              variants={motionVariants}
              style={{ 
                whiteSpace: type === 'words' ? 'nowrap' : 'normal',
                marginRight: type === 'words' ? '0.25rem' : '0',
              }}
            >
              {item === ' ' ? '\u00A0' : item}
            </motion.span>
          ))}
        </div>
      ))}
    </motion.div>
  );
}

export { SplittingText, type SplittingTextProps };