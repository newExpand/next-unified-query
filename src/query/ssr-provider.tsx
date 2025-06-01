"use client";
import React, { useRef } from "react";
import { QueryClientProvider } from "./query-client-provider";
import { QueryClient } from "./query-client";
import { getSSRPrefetchStates, clearSSRPrefetch } from "./ssr-context";

// SSRProvider: 루트에서 자동 merge/hydrate
export function SSRProvider({ children }: { children: React.ReactNode }) {
  // 서버에서 prefetch된 모든 쿼리 결과를 merge
  const dehydratedState = Object.assign({}, ...getSSRPrefetchStates());
  clearSSRPrefetch(); // 메모리 누수 방지

  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient();
    if (dehydratedState) {
      clientRef.current.hydrate(dehydratedState);
    }
  }
  return (
    <QueryClientProvider
      client={clientRef.current!}
      dehydratedState={dehydratedState}
    >
      {children}
    </QueryClientProvider>
  );
}
