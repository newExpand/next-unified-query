"use client";

import { useState } from "react";
import { Menu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavigationTree } from "./navigation-tree";
import { SearchTrigger } from "./search-trigger";
import { TableOfContents } from "./table-of-contents";
import { TocTree } from "@/lib/toc";
import { useSearchKeyboard } from "@/hooks/use-search";
import { cn } from "@/lib/utils";

interface DocsLayoutProps {
  children: React.ReactNode;
  toc?: TocTree;
  className?: string;
}

export function DocsLayout({ children, toc, className }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Set up global keyboard shortcut
  useSearchKeyboard();
  
  return (
    <div className={cn("min-h-screen bg-black", className)}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur lg:hidden">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 min-w-[44px] min-h-[44px]" aria-label="Toggle navigation">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-black border-gray-800 p-0">
                <SheetHeader className="border-b border-gray-800 p-4">
                  <SheetTitle className="text-left">
                    <Link href="/" className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
                      <Database className="h-5 w-5" />
                      <span>next-unified-query</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-4">
                  <SearchTrigger />
                  <NavigationTree />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white hover:text-gray-300 transition-colors">
              <Database className="h-5 w-5" />
              <span>Docs</span>
            </Link>
          </div>
          <div className="flex-1 max-w-md px-4">
            <SearchTrigger />
          </div>
        </div>
      </header>
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Left Sidebar - Navigation */}
        <aside className="fixed left-0 top-0 z-30 h-full w-64 border-r border-gray-800 bg-black">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-800 p-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white hover:text-gray-300 transition-colors">
                <Database className="h-5 w-5" />
                <span>next-unified-query</span>
              </Link>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="p-4 space-y-4">
                <SearchTrigger showDialog={true} />
                <NavigationTree />
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 ml-64 mr-64">
          <div className="container mx-auto px-8 py-8">
            <div className="mx-auto max-w-4xl">
              {children}
            </div>
          </div>
        </main>
        
        {/* Right Sidebar - Table of Contents */}
        <aside className="fixed right-0 top-0 z-30 h-full w-64 border-l border-gray-800 bg-black">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-800 p-4">
              <div className="h-6" /> {/* Spacer to match left sidebar */}
            </div>
            <div className="flex-1 overflow-hidden">
              {toc && <TableOfContents toc={toc} />}
            </div>
          </div>
        </aside>
      </div>
      
      {/* Mobile Content */}
      <main className="lg:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}