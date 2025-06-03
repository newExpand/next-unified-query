import React, { useRef } from "react";
import { QueryClientProvider } from "./query-client-provider";
import { QueryClient } from "./query-client";
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
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient(fetchOptions);
    console.log("[QueryProvider] QueryClient ID:", clientRef.current.__debugId);
    if (isArray(interceptors)) {
      interceptors?.forEach((fn) => fn(clientRef.current!.getFetcher()));
    }
  }
  return (
    <QueryClientProvider client={clientRef.current!}>
      {children}
    </QueryClientProvider>
  );
}
