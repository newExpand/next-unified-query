"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TocItem, TocTree } from "@/lib/toc";
import { useActiveHeading, useScrollToHeading } from "@/hooks/use-active-heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";

interface TableOfContentsProps {
  toc: TocTree;
  className?: string;
}

export function TableOfContents({ toc, className }: TableOfContentsProps) {
  const [headingIds, setHeadingIds] = useState<string[]>([]);
  const activeId = useActiveHeading(headingIds);
  const scrollToHeading = useScrollToHeading();
  
  useEffect(() => {
    const ids = extractHeadingIds(toc.items);
    setHeadingIds(ids);
  }, [toc]);
  
  if (toc.items.length === 0) {
    return null;
  }
  
  return (
    <div className={cn("w-64 min-w-0", className)}>
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-hidden">
        <h4 className="mb-4 px-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
          On This Page
        </h4>
        <ScrollArea className="h-full px-6">
          <nav className="space-y-1">
            {toc.items.map((item) => (
              <TocItemComponent
                key={item.id}
                item={item}
                activeId={activeId}
                onItemClick={scrollToHeading}
              />
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}

interface TocItemComponentProps {
  item: TocItem;
  activeId: string;
  onItemClick: (id: string) => void;
}

function TocItemComponent({ item, activeId, onItemClick }: TocItemComponentProps) {
  const isActive = activeId === item.id;
  
  return (
    <div>
      <button
        onClick={() => onItemClick(item.id)}
        className={cn(
          "block w-full text-left text-sm transition-colors duration-200 hover:text-white",
          "py-1 pl-0 pr-2",
          item.level === 2 && "pl-0",
          item.level === 3 && "pl-4",
          item.level === 4 && "pl-8",
          item.level === 5 && "pl-12",
          item.level === 6 && "pl-16",
          isActive ? "text-white font-medium" : "text-gray-400"
        )}
      >
        <div className="relative">
          {isActive && (
            <motion.div
              layoutId="active-toc-indicator"
              className="absolute -left-6 top-0 h-full w-0.5 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="block truncate">{item.title}</span>
        </div>
      </button>
      {item.children && (
        <div className="ml-4 space-y-1">
          {item.children.map((child) => (
            <TocItemComponent
              key={child.id}
              item={child}
              activeId={activeId}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function extractHeadingIds(items: TocItem[]): string[] {
  const ids: string[] = [];
  
  function traverse(items: TocItem[]) {
    for (const item of items) {
      ids.push(item.id);
      if (item.children) {
        traverse(item.children);
      }
    }
  }
  
  traverse(items);
  return ids;
}