"use client";

import React from "react";
import { HydrationBoundary, QueryProvider } from "next-type-fetch/react";

export function Providers({
  children,
  userDehydrated,
  postsDehydrated,
}: {
  children: React.ReactNode;
  userDehydrated?: any;
  postsDehydrated?: any;
}) {
  return (
    <QueryProvider>
      <HydrationBoundary state={userDehydrated}>
        <HydrationBoundary state={postsDehydrated}>
          {children}
        </HydrationBoundary>
      </HydrationBoundary>
    </QueryProvider>
  );
}
