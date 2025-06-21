import React, { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import type { QueryClient, QueryState, QueryClientOptionsWithInterceptors, InterceptorSetupFunction } from "next-unified-query-core";
import { getQueryClient } from "next-unified-query-core";

const QueryClientContext = createContext<QueryClient | null>(null);

export function HydrationBoundary({
  state,
  children,
}: {
  state?: Record<string, QueryState>;
  children: ReactNode;
}) {
  const client = useQueryClient();
  const hydratedRef = useRef(false);

  // 한 번만 hydration 수행
  if (state && !hydratedRef.current) {
    client.hydrate(state);
    hydratedRef.current = true;
  }

  return <>{children}</>;
}

export interface QueryClientProviderProps {
  /**
   * QueryClient 인스턴스 (선택사항)
   * 제공하지 않으면 자동으로 환경에 맞는 인스턴스를 생성합니다.
   */
  client?: QueryClient;
  /**
   * QueryClient 옵션 (client가 제공되지 않은 경우에만 사용)
   */
  options?: QueryClientOptionsWithInterceptors;
  /**
   * 인터셉터 설정 함수 (client가 제공되지 않은 경우에만 사용)
   * options.setupInterceptors보다 우선순위가 높습니다.
   */
  setupInterceptors?: InterceptorSetupFunction;
  children: ReactNode;
}

export function QueryClientProvider({
  client,
  options,
  setupInterceptors,
  children,
}: QueryClientProviderProps) {
  // client가 제공되지 않으면 자동으로 생성
  const queryClient =
    client ||
    getQueryClient({
      ...options,
      setupInterceptors: setupInterceptors || options?.setupInterceptors,
    });

  return (
    <QueryClientContext.Provider value={queryClient}>
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
