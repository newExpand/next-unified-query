import { QueryClient } from "./query-client";
import type { QueryClientOptions } from "./query-client";
import type { NextTypeFetch } from "../../types/index";

/**
 * 인터셉터 설정 함수 타입
 */
export type InterceptorSetupFunction = (fetcher: NextTypeFetch) => void;

/**
 * 인터셉터 설정을 포함한 QueryClient 옵션
 */
export interface QueryClientOptionsWithInterceptors extends QueryClientOptions {
	/**
	 * 인터셉터 설정 함수
	 * fetcher 인스턴스를 받아서 인터셉터를 등록하는 함수
	 */
	setupInterceptors?: InterceptorSetupFunction;
}

/**
 * 전역 QueryClient 인스턴스 (클라이언트 환경에서만 사용)
 */
let globalQueryClient: QueryClient | undefined = undefined;

/**
 * 기본 QueryClient 옵션
 */
let defaultOptions: QueryClientOptionsWithInterceptors | undefined = undefined;

/**
 * 기본 QueryClient 옵션을 설정합니다.
 * 앱 시작 시 한 번만 호출하면 됩니다.
 *
 * @internal React의 configureQueryClient를 사용하는 것을 권장합니다.
 */
export function setDefaultQueryClientOptions(options: QueryClientOptionsWithInterceptors): void {
	defaultOptions = options;

	// 전역 fetch 인스턴스도 동일한 설정으로 업데이트
	updateGlobalFetchInstance(options);

	// 클라이언트 환경에서 이미 생성된 전역 인스턴스가 있다면 새 설정으로 재생성
	if (typeof window !== "undefined" && globalQueryClient) {
		globalQueryClient = createQueryClientWithSetup(options);
	}
}

/**
 * 전역 fetch 인스턴스를 업데이트하는 함수
 */
function updateGlobalFetchInstance(options: QueryClientOptionsWithInterceptors): void {
	// 동적 import를 사용하여 순환 의존성 방지
	import("../../fetch").then(({ updateDefaultInstance }) => {
		const { setupInterceptors, ...fetchConfig } = options;
		updateDefaultInstance(fetchConfig);

		// 인터셉터 설정이 있다면 적용
		if (setupInterceptors) {
			import("../../fetch").then(({ interceptors }) => {
				// 기존 인터셉터를 완전히 초기화하지 않고 새로운 설정만 추가
				// 이미 등록된 중요한 인터셉터(인증, 사용자 역할 등)는 보존됨

				// 새 인터셉터 설정을 위해 더미 fetcher 객체 생성
				const dummyFetcher = { interceptors };
				setupInterceptors(dummyFetcher as any);
			});
		}
	});
}

/**
 * 인터셉터 설정을 포함한 QueryClient를 생성합니다.
 */
function createQueryClientWithSetup(options?: QueryClientOptionsWithInterceptors): QueryClient {
	if (!options?.setupInterceptors) {
		return new QueryClient(options);
	}

	const { setupInterceptors, ...clientOptions } = options;
	const client = new QueryClient(clientOptions);

	// 인터셉터 설정 실행
	setupInterceptors(client.getFetcher());

	return client;
}

/**
 * 환경에 맞는 QueryClient를 자동으로 반환합니다.
 * - 서버 환경: 항상 새로운 인스턴스 생성 (요청 격리)
 * - 클라이언트 환경: 싱글톤 패턴 사용 (상태 유지)
 */
export function getQueryClient(options?: QueryClientOptionsWithInterceptors): QueryClient {
	// defaultOptions와 options를 병합 (options가 우선순위)
	const finalOptions = defaultOptions ? { ...defaultOptions, ...options } : options;

	// 서버 환경에서는 항상 새로운 인스턴스 생성
	if (typeof window === "undefined") {
		return createQueryClientWithSetup(finalOptions);
	}

	// 클라이언트 환경에서는 싱글톤 패턴 사용
	if (!globalQueryClient) {
		globalQueryClient = createQueryClientWithSetup(finalOptions);
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

/**
 * 인터셉터 설정을 포함한 QueryClient 생성 헬퍼 함수
 *
 * @example
 * ```typescript
 * import { createQueryClientWithInterceptors } from 'next-type-fetch';
 *
 * const queryClient = createQueryClientWithInterceptors({
 *   baseURL: 'https://api.example.com',
 * }, (fetcher) => {
 *   // 인터셉터 설정
 *   fetcher.interceptors.request.use((config) => {
 *     config.headers = config.headers || {};
 *     config.headers['Authorization'] = `Bearer ${getToken()}`;
 *     return config;
 *   });
 * });
 * ```
 */
export function createQueryClientWithInterceptors(
	options: QueryClientOptions,
	setupInterceptors: InterceptorSetupFunction,
): QueryClient {
	return createQueryClientWithSetup({
		...options,
		setupInterceptors,
	});
}
