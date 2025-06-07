import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import { QueryClient } from "./query-client";

const QueryClientContext = createContext<QueryClient | null>(null);

export function HydrationBoundary({
  state,
  children,
}: {
  state?: any;
  children: ReactNode;
}) {
  const client = useQueryClient();
  const hydratedRef = useRef(false);
  // SSR/CSR 모두에서 최초 1회만 hydrate
  if (state && !hydratedRef.current) {
    client.hydrate(state);
    hydratedRef.current = true;
  }
  return <>{children}</>;
}

export interface QueryClientProviderProps {
  client: QueryClient;
  children: ReactNode;
}

export function QueryClientProvider({
  client,
  children,
}: QueryClientProviderProps) {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
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
