"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "./search-dialog";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  className?: string;
  showDialog?: boolean;
}

export function SearchTrigger({ className, showDialog = false }: SearchTriggerProps) {
  const { open, setOpen } = useSearch();
  
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-start gap-2 border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search documentation...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-700 bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      {showDialog && <SearchDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}