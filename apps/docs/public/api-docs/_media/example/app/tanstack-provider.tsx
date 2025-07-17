"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LIBRARY_OPTIMIZED_CONFIGS } from "./benchmark/shared-config";

export function TanStackProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // TanStack Query 최적화된 설정 사용
            ...LIBRARY_OPTIMIZED_CONFIGS.TANSTACK_QUERY,
            retry: 3,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
