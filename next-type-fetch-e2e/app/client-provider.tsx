"use client";

import { QueryClient } from "next-type-fetch";
import { HydrationBoundary, QueryClientProvider } from "next-type-fetch/react";
import {
  registerInterceptors,
  registerInterceptors2,
} from "./register-interceptors";

const queryClient = new QueryClient();

registerInterceptors(queryClient);
registerInterceptors2(queryClient);

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
