"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationItem } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "motion/react";

interface NavigationItemProps {
  item: NavigationItem;
  level?: number;
}

export function NavigationItemComponent({ item, level = 0 }: NavigationItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  
  const isActive = pathname === item.href;
  const hasChildren = item.items && item.items.length > 0;
  
  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-800/60",
              level > 0 && "pl-6"
            )}
          >
            <span className="text-gray-300">{item.title}</span>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.items?.map((subItem, index) => (
              <NavigationItemComponent
                key={index}
                item={subItem}
                level={level + 1}
              />
            ))}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  
  if (!item.href) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-gray-400",
          level > 0 && "pl-6"
        )}
      >
        <span>{item.title}</span>
        {item.label && (
          <Badge variant="secondary" className="ml-2">
            {item.label}
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
        level > 0 && "pl-6",
        isActive
          ? "bg-gray-800 text-white"
          : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
      )}
    >
      <div className="flex items-center gap-2">
        <span>{item.title}</span>
        {item.label && (
          <Badge variant="secondary" className="ml-1">
            {item.label}
          </Badge>
        )}
      </div>
      {item.external && (
        <svg
          className="h-3 w-3 text-gray-400"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15,3 21,3 21,9" />
          <line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      )}
    </Link>
  );
}