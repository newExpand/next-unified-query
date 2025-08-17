import { useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import type { ZodType, FetchConfig, FetchError, QueryFetcher } from "next-unified-query-core";
import { isObject, has, isFunction } from "es-toolkit/compat";
import { useQueryClient } from "../query-client-provider";
import type { QueryConfig, ExtractParams, ExtractQueryData } from "next-unified-query-core";
import { validateQueryConfig } from "next-unified-query-core";
import { QueryObserver, type QueryObserverOptions, type QueryObserverResult } from "next-unified-query-core";

/**
 * 기본 UseQuery 옵션 (공통 속성)
 */
interface BaseUseQueryOptions<T = any> {
	cacheKey: readonly unknown[];
	params?: Record<string, any>;
	schema?: ZodType;
	fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
	enabled?: boolean;
	staleTime?: number;
	select?: (data: T) => any;
	selectDeps?: any[];
	/**
	 * placeholderData: fetch 전 임시 데이터 또는 이전 데이터 유지
	 * 값 또는 함수(prevData, prevQuery) 모두 지원
	 * ReactNode(JSX)도 허용
	 */
	placeholderData?:
		| T
		| React.ReactNode
		| ((prevData: T | React.ReactNode | undefined, prevQuery?: any) => T | React.ReactNode);
	/**
	 * gcTime: 쿼리 데이터가 사용되지 않을 때(구독자가 0이 될 때) 가비지 컬렉션까지의 시간(ms)
	 * 이는 생명주기 관리 전략으로, maxQueries(메모리 보호)와는 별개로 동작합니다.
	 * @default 300000 (5분)
	 */
	gcTime?: number;
	/**
	 * 에러 발생 시 Error Boundary로 전파할지 여부
	 * - boolean: true면 모든 에러를 Error Boundary로 전파
	 * - function: 조건부 전파 (예: (error) => error.response?.status >= 500)
	 * @default false
	 */
	throwOnError?: boolean | ((error: FetchError) => boolean);
}

/**
 * URL 기반 UseQuery 옵션
 */
interface UrlBasedUseQueryOptions<T = any> extends BaseUseQueryOptions<T> {
	/**
	 * API 요청 URL
	 */
	url: string;

	/**
	 * queryFn이 있으면 안됨 (상호 배제)
	 */
	queryFn?: never;
}

/**
 * Custom Function 기반 UseQuery 옵션
 */
interface FunctionBasedUseQueryOptions<T = any> extends BaseUseQueryOptions<T> {
	/**
	 * 복잡한 요청을 위한 커스텀 쿼리 함수
	 * Options 방식에서는 QueryFetcher만 전달 (GET/HEAD 메서드만 허용)
	 * 인자: fetcher (QueryFetcher 인스턴스)
	 */
	queryFn: (fetcher: QueryFetcher) => Promise<T>;

	/**
	 * url이 있으면 안됨 (상호 배제)
	 */
	url?: never;
}

/**
 * UseQuery 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
export type UseQueryOptions<T = any> = UrlBasedUseQueryOptions<T> | FunctionBasedUseQueryOptions<T>;

/**
 * UseQuery 결과 타입
 * QueryObserverResult의 alias로, 쿼리 상태와 데이터를 포함합니다.
 */
export type UseQueryResult<TData = unknown, TError = FetchError> = QueryObserverResult<TData, TError>;

/**
 * Schema에서 타입을 추출하는 도우미 타입
 */
type InferSchemaType<T> = T extends { schema: infer S }
	? S extends ZodType
		? import("next-unified-query-core").z.infer<S>
		: any
	: any;

type UseQueryFactoryOptions<P, T> = Omit<
	UseQueryOptions<T>,
	"cacheKey" | "url" | "queryFn" | "params" | "schema" | "fetchConfig"
> &
	(P extends void ? { params?: P } : keyof P extends never ? { params?: P } : { params: P });

/**
 * 캐싱과 상태 관리를 제공하는 데이터 페칭 React 훅입니다.
 *
 * **환경 호환성:**
 * - ❌ 서버사이드: 서버 컴포넌트와 호환되지 않음 (React context 사용)
 * - ✅ 클라이언트사이드: React context가 있는 React 컴포넌트에서 사용
 * - ⚠️ SSR: "use client" 지시어가 있는 클라이언트 컴포넌트에서만 사용
 *
 * @example
 * ```typescript
 * // 클라이언트 컴포넌트에서만 사용
 * "use client";
 * import { useQuery } from 'next-unified-query/react';
 *
 * function UserProfile({ userId }: { userId: number }) {
 *   const { data, isLoading, error } = useQuery(api.getUser, { params: userId });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>Hello {data.name}</div>;
 * }
 * ```
 */
// 1. 명시적 타입을 가진 Factory 기반 (최고 우선순위): useQuery<T>(query, options)
export function useQuery<T, E = FetchError>(
	query: QueryConfig<any, any>,
	options: UseQueryFactoryOptions<ExtractParams<typeof query>, T>,
): UseQueryResult<T, E>;

// 2. 스키마 추론을 가진 Factory 기반 (높은 우선순위): useQuery(query, options)
export function useQuery<Q extends QueryConfig<any, any>, E = FetchError>(
	query: Q,
	options: UseQueryFactoryOptions<ExtractParams<Q>, ExtractQueryData<Q>>,
): UseQueryResult<ExtractQueryData<Q>, E>;

// 3. Options-based with schema inference (MEDIUM-HIGH priority): useQuery(options) - schema 있는 경우
export function useQuery<O extends UseQueryOptions<any> & { schema: ZodType }, E = FetchError>(
	options: O,
): UseQueryResult<InferSchemaType<O>, E>;

// 4. Options-based with explicit type (MEDIUM priority): useQuery<T>(options) - 모든 옵션 허용
export function useQuery<T, E = FetchError>(options: UseQueryOptions<T>): UseQueryResult<T, E>;

// 구현부
export function useQuery(arg1: any, arg2?: any): any {
	// QueryConfig 기반
	if (isObject(arg1) && has(arg1, "cacheKey") && isFunction((arg1 as QueryConfig<any, any>).cacheKey)) {
		const query = arg1 as QueryConfig<any, any>;

		// QueryConfig 런타임 검증
		validateQueryConfig(query);

		const options = arg2 ?? {};
		const params = options.params;
		const cacheKey = query.cacheKey?.(params);
		const url = query.url?.(params);
		const queryFn = query.queryFn;
		const schema = query.schema;
		const placeholderData = options.placeholderData ?? query.placeholderData;
		const fetchConfig = options.fetchConfig ?? query.fetchConfig;
		const select = options.select ?? query.select;
		const selectDeps = options.selectDeps ?? query.selectDeps;
		const enabled = has(options, "enabled")
			? options.enabled // 명시적으로 전달된 경우 해당 값 사용
			: isFunction(query.enabled)
				? query.enabled(params) // Factory의 enabled 함수 호출
				: query.enabled; // Factory의 enabled 불린 값 사용

		return _useQueryObserver({
			...query,
			...options,
			enabled,
			cacheKey,
			url,
			queryFn,
			params,
			schema,
			placeholderData,
			fetchConfig,
			select,
			selectDeps,
		});
	}
	// 명시적 타입 지정 방식
	return _useQueryObserver({
		...arg1,
	});
}

function _useQueryObserver<T = unknown, E = FetchError>(options: UseQueryOptions<T>): UseQueryResult<T, E> {
	// UseQueryOptions 런타임 검증 (factory의 validateQueryConfig 사용)
	validateQueryConfig(options);

	const queryClient = useQueryClient();
	const observerRef = useRef<QueryObserver<T, E> | undefined>(undefined);

	// 기본 결과 객체를 캐싱하여 안정적인 참조 제공
	const defaultResultRef = useRef<UseQueryResult<T, E>>({
		data: undefined,
		error: undefined,
		isLoading: true,
		isFetching: true,
		isError: false,
		isSuccess: false,
		isStale: true,
		isPlaceholderData: false,
		refetch: () => {},
	});

	// Observer 생성 또는 옵션 업데이트 (렌더링 중 직접 처리)
	if (!observerRef.current) {
		observerRef.current = new QueryObserver<T, E>(queryClient, {
			...options,
			key: options.cacheKey,
		} as QueryObserverOptions<T>);
	} else {
		// setOptions가 내부적으로 변경 여부를 체크하므로 항상 호출
		observerRef.current.setOptions({
			...options,
			key: options.cacheKey,
		} as QueryObserverOptions<T>);
	}

	// 안정적인 subscribe 함수
	const subscribe = useCallback((callback: () => void) => {
		return observerRef.current!.subscribe(callback);
	}, []);

	// 최적화된 getSnapshot 함수
	const getSnapshot = useCallback(() => {
		if (!observerRef.current) {
			// Observer가 없는 경우 캐시된 기본 결과 반환
			return defaultResultRef.current;
		}

		// QueryObserver에서 이미 Tracked Properties와 Structural Sharing이 처리됨
		// 추가적인 비교 없이 결과를 그대로 반환
		return observerRef.current.getCurrentResult();
	}, []);

	// useSyncExternalStore로 Observer 구독
	const result = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot, // getServerSnapshot도 동일하게
	);

	// Observer 시작 (컴포넌트 마운트 후)
	useEffect(() => {
		observerRef.current?.start();
	}, []);

	// Error Boundary로 에러 전파
	useEffect(() => {
		if (result.error && options.throwOnError) {
			const shouldThrow = typeof options.throwOnError === 'function' 
				? options.throwOnError(result.error as unknown as FetchError)
				: options.throwOnError;
			
			if (shouldThrow) {
				throw result.error;
			}
		}
		// result.error만 dependency에 포함 (options.throwOnError는 매번 변경될 수 있음)
	}, [result.error]);

	// 컴포넌트 언마운트 시 Observer 정리
	useEffect(() => {
		return () => {
			observerRef.current?.destroy();
		};
	}, []);

	return result;
}
