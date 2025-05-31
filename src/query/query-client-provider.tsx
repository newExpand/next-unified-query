"use client";

import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { QueryClient } from "./query-client";

const QueryClientContext = createContext<QueryClient | null>(null);

function HydrationBoundary({
  state,
  children,
}: {
  state?: any;
  children: ReactNode;
}) {
  const client = useQueryClient();
  useEffect(() => {
    if (state) {
      client.hydrate(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return <>{children}</>;
}

export interface QueryClientProviderProps {
  client: QueryClient;
  dehydratedState?: any; // SSR에서만 전달
  children: ReactNode;
}

export function QueryClientProvider({
  client,
  dehydratedState,
  children,
}: QueryClientProviderProps) {
  return (
    <QueryClientContext.Provider value={client}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientContext.Provider>
  );
}

export function useQueryClient(): QueryClient {
  const ctx = useContext(QueryClientContext);
  if (!ctx)
    throw new Error(
      "You must wrap your component tree with <QueryClientProvider>."
    );
  return ctx;
}
