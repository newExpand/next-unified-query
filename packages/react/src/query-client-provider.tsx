import React, { createContext, useContext, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import type { QueryClient, QueryState, QueryClientOptions } from "next-unified-query-core";
import { getQueryClient, configureQueryClient } from "next-unified-query-core";

const QueryClientContext = createContext<QueryClient | null>(null);
const QueryConfigContext = createContext<QueryClientOptions | undefined>(undefined);

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
	 * QueryClient 설정 (권장)
	 * client가 제공되지 않은 경우 이 설정으로 QueryClient를 생성합니다.
	 * SSR과 Client 모두에서 동일한 설정이 적용됩니다.
	 */
	config?: QueryClientOptions;
	/**
	 * @deprecated config를 사용하세요
	 */
	options?: QueryClientOptions;
	children: ReactNode;
}

export function QueryClientProvider({ client, config, options: deprecatedOptions, children }: QueryClientProviderProps) {
	// config가 options보다 우선순위가 높음
	const finalConfig = config || deprecatedOptions;
	
	// config가 제공되면 즉시 전역 설정으로 저장 (서버/클라이언트 모두에서 동작)
	if (finalConfig && typeof window !== "undefined") {
		// 클라이언트에서만 전역 설정 저장
		configureQueryClient(finalConfig);
	}
	
	// client가 제공되지 않으면 자동으로 생성
	const queryClient = useMemo(
		() => client || getQueryClient(finalConfig),
		[client, finalConfig]
	);

	return (
		<QueryConfigContext.Provider value={finalConfig}>
			<QueryClientContext.Provider value={queryClient}>
				{children}
			</QueryClientContext.Provider>
		</QueryConfigContext.Provider>
	);
}

export function useQueryClient(): QueryClient {
	const ctx = useContext(QueryClientContext);
	if (!ctx) throw new Error("You must wrap your component tree with <QueryClientProvider>.");
	return ctx;
}

/**
 * QueryClient 설정에 접근하는 Hook
 * SSR 환경에서 설정을 공유하기 위해 사용됩니다.
 */
export function useQueryConfig(): QueryClientOptions | undefined {
	return useContext(QueryConfigContext);
}
