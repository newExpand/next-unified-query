"use client";
import React, { useRef } from "react";
import { QueryClientProvider } from "./query-client-provider";
import { QueryClient } from "./query-client";
import { getSSRPrefetchStates, clearSSRPrefetch } from "./ssr-context";
import type { FetchConfig } from "../types/index";
import { isArray } from "es-toolkit/compat";

export interface QueryProviderProps extends FetchConfig {
  children: React.ReactNode;
  interceptors?: Array<(fetcher: any) => void>;
}

// QueryProvider: 루트에서 자동 merge/hydrate
export function QueryProvider({
  children,
  interceptors,
  ...fetchOptions
}: QueryProviderProps) {
  // 서버에서 prefetch된 모든 쿼리 결과를 merge
  const dehydratedState = Object.assign({}, ...getSSRPrefetchStates());
  clearSSRPrefetch(); // 메모리 누수 방지

  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient(fetchOptions);
    if (isArray(interceptors)) {
      interceptors?.forEach((fn) => fn(clientRef.current!.getFetcher()));
    }
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
