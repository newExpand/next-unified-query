"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StarsBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  factor?: number;
  starColor?: string;
  pointerEvents?: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  id: number;
}

function StarsBackground({
  children,
  className,
  factor = 0.05,
  starColor = '#ffffff',
  pointerEvents = true,
}: StarsBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = React.useState<Star[]>([]);
  const animationRef = React.useRef<number>(0);

  // Generate stars
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const generateStars = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const starCount = Math.floor(width * height * factor);
      
      const newStars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          id: i,
        });
      }
      setStars(newStars);
    };

    generateStars();
    window.addEventListener('resize', generateStars);
    return () => window.removeEventListener('resize', generateStars);
  }, [factor]);

  // Animation loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = starColor;

      stars.forEach((star) => {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Move stars slowly
        star.x += Math.sin(Date.now() * 0.001 + star.id) * 0.1;
        star.y += Math.cos(Date.now() * 0.001 + star.id) * 0.1;
        
        // Wrap around screen
        if (star.x > width) star.x = 0;
        if (star.x < 0) star.x = width;
        if (star.y > height) star.y = 0;
        if (star.y < 0) star.y = height;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars, starColor]);

  // Handle mouse movement (placeholder for future interactivity)
  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!pointerEvents) return;
    // Future: add interactive star effects based on mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // Mouse position calculations for future features
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Use mouseX, mouseY for interactive effects
      console.log('Mouse position:', { x: mouseX, y: mouseY });
    }
  }, [pointerEvents]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: pointerEvents ? 'auto' : 'none' }}
        onMouseMove={handleMouseMove}
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

export { StarsBackground, type StarsBackgroundProps };