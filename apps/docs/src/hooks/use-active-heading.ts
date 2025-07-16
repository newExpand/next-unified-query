"use client";

import { useEffect, useState } from "react";

export function useActiveHeading(headingIds: string[]) {
  const [activeId, setActiveId] = useState<string>("");
  
  useEffect(() => {
    if (headingIds.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id);
        
        if (visibleHeadings.length > 0) {
          // Find the first visible heading
          const firstVisibleHeading = headingIds.find((id) =>
            visibleHeadings.includes(id)
          );
          if (firstVisibleHeading) {
            setActiveId(firstVisibleHeading);
          }
        }
      },
      {
        rootMargin: "-80px 0px -80px 0px",
        threshold: 0.1
      }
    );
    
    // Observe all headings
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [headingIds]);
  
  return activeId;
}

export function useScrollToHeading() {
  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };
  
  return scrollToHeading;
}