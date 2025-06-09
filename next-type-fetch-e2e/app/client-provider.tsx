"use client";

import { QueryClient } from "next-type-fetch";
import { HydrationBoundary, QueryClientProvider } from "next-type-fetch/react";
import {
  registerInterceptors,
  registerInterceptors2,
} from "./register-interceptors";

let queryClient: QueryClient | null = null;

export function ClientProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state?: any;
}) {
  if (!queryClient) {
    queryClient = new QueryClient({
      baseURL: "http://localhost:3001",
    });
    registerInterceptors(queryClient);
    registerInterceptors2(queryClient);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
