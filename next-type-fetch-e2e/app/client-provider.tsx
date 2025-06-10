"use client";

import { QueryClientProvider, HydrationBoundary } from "next-type-fetch/react";
import { queryClient } from "./lib/api"; // 중앙 API 모듈에서 import

export function ClientProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state?: any;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
