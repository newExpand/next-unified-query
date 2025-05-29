import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { QueryClient } from "./query-client";

// HydrationBoundary: SSR에서만 동작, CSR에서는 noop
function HydrationBoundary({
  state,
  children,
}: {
  state?: any;
  children: ReactNode;
}) {
  // 실제 구현에서는 state를 QueryClient에 hydrate
  // 여기서는 SSR/CSR 구분 없이 children만 반환 (추후 확장 가능)
  return <>{children}</>;
}

const QueryClientContext = createContext<QueryClient | null>(null);

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
