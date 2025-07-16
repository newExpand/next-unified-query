"use client";

import { useState, useEffect } from "react";

let globalSearchOpen = false;
let globalSearchSetters: ((open: boolean) => void)[] = [];

export function useSearch() {
  const [open, setOpen] = useState(globalSearchOpen);
  
  useEffect(() => {
    // Add this setter to the global list
    globalSearchSetters.push(setOpen);
    
    // Remove this setter when component unmounts
    return () => {
      globalSearchSetters = globalSearchSetters.filter(setter => setter !== setOpen);
    };
  }, []);
  
  const setGlobalOpen = (newOpen: boolean) => {
    globalSearchOpen = newOpen;
    globalSearchSetters.forEach(setter => setter(newOpen));
  };
  
  return { open, setOpen: setGlobalOpen };
}

export function useSearchKeyboard() {
  const { setOpen } = useSearch();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);
}