import { QueryClient } from "./query-client";
import type { QueryClientOptions } from "./query-client";

/**
 * 전역 QueryClient 인스턴스 (클라이언트 환경에서만 사용)
 */
let globalQueryClient: QueryClient | undefined = undefined;

/**
 * 전역 기본 QueryClient 설정
 */
let defaultQueryClientOptions: QueryClientOptions | undefined = undefined;

/**
 * QueryClient의 전역 설정을 구성합니다.
 * SSR과 클라이언트 환경 모두에서 일관된 설정을 보장합니다.
 * 
 * @example
 * ```typescript
 * // app/layout.tsx (Next.js App Router)
 * import { configureQueryClient } from 'next-unified-query';
 * import { queryConfig } from './query-config';
 * 
 * // SSR과 클라이언트 모두에서 사용할 전역 설정
 * configureQueryClient(queryConfig);
 * ```
 * 
 * @param options QueryClient 설정
 */
export function configureQueryClient(options: QueryClientOptions): void {
	defaultQueryClientOptions = options;
}

/**
 * 환경에 맞는 QueryClient를 자동으로 반환합니다.
 * - 서버 환경: 항상 새로운 인스턴스 생성 (요청 격리)
 * - 클라이언트 환경: 싱글톤 패턴 사용 (상태 유지)
 * 
 * @param options QueryClient 옵션 (제공되지 않으면 전역 기본 설정 사용)
 * @returns QueryClient 인스턴스
 */
export function getQueryClient(options?: QueryClientOptions): QueryClient {
	// 옵션이 제공되지 않으면 전역 기본 설정 사용
	const finalOptions = options || defaultQueryClientOptions;
	
	// 서버 환경에서는 항상 새로운 인스턴스 생성
	if (typeof window === "undefined") {
		return new QueryClient(finalOptions);
	}

	// 클라이언트 환경에서는 싱글톤 패턴 사용
	if (!globalQueryClient) {
		globalQueryClient = new QueryClient(finalOptions);
	}

	return globalQueryClient;
}

/**
 * 클라이언트 환경에서 전역 QueryClient를 재설정합니다.
 * 주로 테스트나 특수한 경우에 사용됩니다.
 */
export function resetQueryClient(): void {
	if (typeof window !== "undefined") {
		globalQueryClient = undefined;
	}
}