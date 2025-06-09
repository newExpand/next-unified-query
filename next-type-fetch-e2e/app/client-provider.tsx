"use client";

import { QueryClient } from "next-type-fetch";
import { HydrationBoundary, QueryClientProvider } from "next-type-fetch/react";
import {
  registerInterceptors,
  registerInterceptors2,
} from "./register-interceptors";
import { useState } from "react";

export function ClientProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state?: any;
}) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      baseURL: "http://localhost:3001",
    });
    registerInterceptors(client);
    registerInterceptors2(client);
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
