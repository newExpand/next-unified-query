"use client";

import { useState, useEffect } from "react";
import { Search, File, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  title: string;
  description?: string;
  href: string;
  type: "page" | "section" | "heading";
  breadcrumb?: string[];
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    // Mock search results - in real implementation, this would be replaced with Algolia
    const mockResults: SearchResult[] = [
      {
        title: "Installation",
        description: "Get started with next-unified-query in your project",
        href: "/docs/installation",
        type: "page",
        breadcrumb: ["Getting Started"]
      },
      {
        title: "Getting Started",
        description: "Learn the basics and create your first query",
        href: "/docs/getting-started",
        type: "page",
        breadcrumb: ["Getting Started"]
      },
      {
        title: "API Reference",
        description: "Complete API documentation",
        href: "/docs/api-reference",
        type: "page",
        breadcrumb: ["API Reference"]
      },
      {
        title: "Query Builder",
        description: "Build type-safe queries with our fluent API",
        href: "/docs/query-builder",
        type: "page",
        breadcrumb: ["Core Concepts"]
      },
      {
        title: "Type Safety",
        description: "Leverage TypeScript for better development experience",
        href: "/docs/type-safety",
        type: "page",
        breadcrumb: ["Core Concepts"]
      }
    ];
    
    // Simple search filter - in real implementation, this would be Algolia search
    const filtered = mockResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);
  
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        window.location.href = results[selectedIndex].href;
        onOpenChange(false);
      }
    }
  };
  
  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "page":
        return <File className="h-4 w-4" />;
      case "section":
        return <Hash className="h-4 w-4" />;
      case "heading":
        return <Hash className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Search Documentation</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent p-0 text-white placeholder:text-gray-400 focus-visible:ring-0"
            autoFocus
          />
        </div>
        
        {results.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.href}
                  onClick={() => {
                    window.location.href = result.href;
                    onOpenChange(false);
                  }}
                  className={cn(
                    "w-full rounded-md p-3 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-gray-800"
                      : "hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-gray-400">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                          {result.title}
                        </h3>
                        {result.breadcrumb && (
                          <Badge variant="secondary" className="text-xs">
                            {result.breadcrumb.join(" > ")}
                          </Badge>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : query.length >= 2 ? (
          <div className="p-8 text-center text-gray-400">
            <Search className="h-8 w-8 mx-auto mb-2" />
            <p>No results found for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Search className="h-8 w-8 mx-auto mb-2" />
            <p>Start typing to search documentation...</p>
          </div>
        )}
        
        <div className="border-t border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="text-gray-500">
              Search powered by Algolia (coming soon)
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}