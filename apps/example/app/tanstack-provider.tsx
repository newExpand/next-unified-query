"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { COMMON_CACHE_CONFIG } from "./benchmark/shared-config";

export function TanStackProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: COMMON_CACHE_CONFIG.staleTime, // 다른 라이브러리와 동일
            gcTime: COMMON_CACHE_CONFIG.gcTime, // 다른 라이브러리와 동일
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
