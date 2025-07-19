"use client";

import { navigation } from "@/lib/navigation";
import { NavigationItemComponent } from "./navigation-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function NavigationTree() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="p-4 pb-8">
        <nav className="space-y-6">
          {navigation.map((group, index) => (
            <div key={index} className="space-y-2">
              <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => (
                  <NavigationItemComponent
                    key={itemIndex}
                    item={item}
                  />
                ))}
              </div>
              {index < navigation.length - 1 && (
                <Separator className="bg-gray-800 my-4" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </ScrollArea>
  );
}