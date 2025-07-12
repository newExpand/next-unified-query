import { QueryCache } from "../cache/query-cache";
import type { QueryState, QueryCacheOptions } from "../cache/query-cache";
import { isArray, isString, forEach, isEqual } from "es-toolkit/compat";
import { createFetch } from "../../core/client";
import type { FetchConfig, NextTypeFetch } from "../../types/index";
import type { QueryConfig } from "../factories/query-factory";

export interface QueryClientOptions extends FetchConfig {
	fetcher?: NextTypeFetch;
	/**
	 * QueryCache 옵션
	 */
	queryCache?: QueryCacheOptions;
}

/**
 * QueryClient 클래스 - 쿼리와 캐시 관리의 중심
 *
 * 이 클래스는 다음과 같은 고급 사용 케이스에서 직접 사용할 수 있습니다:
 * - SSR/SSG에서 서버 사이드 데이터 prefetch
 * - 복잡한 캐시 조작이 필요한 경우
 * - React 외부에서 쿼리 시스템 사용
 *
 * 일반적인 React 컴포넌트에서는 useQuery, useMutation hooks를 사용하세요.
 *
 * @example
 * ```tsx
 * // ✅ SSR에서 사용
 * const queryClient = new QueryClient();
 * await queryClient.prefetchQuery({ cacheKey: ['users'], url: '/users' });
 *
 * // ✅ 캐시 직접 조작
 * queryClient.setQueryData(['user', 1], userData);
 *
 * // ✅ React 컴포넌트에서는 hooks 사용
 * const { data } = useQuery({ cacheKey: ['users'], url: '/users' });
 * ```
 */
export class QueryClient {
	private cache: QueryCache;
	private fetcher: NextTypeFetch;

	constructor(options?: QueryClientOptions) {
		this.cache = new QueryCache(options?.queryCache);
		this.fetcher = options?.fetcher || createFetch(options);
	}

	has(key: string | readonly unknown[]): boolean {
		return this.cache.has(key);
	}

	getFetcher() {
		return this.fetcher;
	}

	/**
	 * 쿼리 상태 조회
	 */
	get<T = unknown>(key: string | readonly unknown[]): QueryState<T> | undefined {
		return this.cache.get<T>(key);
	}

	/**
	 * 쿼리 상태 저장
	 */
	set(key: string | readonly unknown[], state: QueryState): void {
		this.cache.set(key, state);
	}

	/**
	 * 쿼리 데이터만 업데이트 (optimistic update에 최적화)
	 * 기존 상태(isLoading, isFetching, error)를 유지하면서 data와 updatedAt만 업데이트
	 */
	setQueryData<T = unknown>(
		key: string | readonly unknown[],
		updater: T | ((oldData: T | undefined) => T | undefined),
	): void {
		const existing = this.get<T>(key);

		const newData =
			typeof updater === "function" ? (updater as (oldData: T | undefined) => T | undefined)(existing?.data) : updater;

		// 기존 상태를 유지하면서 data와 updatedAt만 업데이트
		const newState: QueryState<T> = {
			data: newData,
			error: existing?.error,
			isLoading: existing?.isLoading ?? false,
			isFetching: existing?.isFetching ?? false,
			updatedAt: Date.now(),
		};

		this.set(key, newState);
	}

	/**
	 * 쿼리 상태 삭제
	 */
	delete(key: string | readonly unknown[]): void {
		this.cache.delete(key);
	}

	/**
	 * 모든 쿼리 상태 반환
	 */
	getAll(): Record<string, QueryState> {
		return this.cache.getAll();
	}

	/**
	 * 모든 쿼리 상태 초기화
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * 특정 쿼리키(혹은 prefix)로 시작하는 모든 쿼리 캐시를 무효화(삭제)
	 * 예: invalidateQueries(['user']) → ['user', ...]로 시작하는 모든 캐시 삭제
	 */
	invalidateQueries(prefix: string | readonly unknown[]) {
		const all = this.getAll();
		if (isArray(prefix)) {
			const prefixArr = Array.from(prefix);
			forEach(Object.keys(all), (key) => {
				try {
					const keyArr = JSON.parse(key);
					if (Array.isArray(keyArr) && isEqual(keyArr.slice(0, prefixArr.length), prefixArr)) {
						const currentState = this.cache.get(keyArr);
						if (currentState) {
							this.cache.set(keyArr, { ...currentState, updatedAt: 0 });
						}
					}
				} catch {
					// string key는 무시
				}
			});
		} else {
			const prefixStr = isString(prefix) ? prefix : String(prefix);
			forEach(Object.keys(all), (key) => {
				if (key.startsWith(prefixStr)) {
					const currentState = this.cache.get(key);
					if (currentState) {
						this.cache.set(key, { ...currentState, updatedAt: 0 });
					}
				}
			});
		}
	}

	/**
	 * 구독자 관리 (public)
	 */
	subscribeListener(key: string | readonly unknown[], listener: () => void): () => void {
		return this.cache.subscribeListener(key, listener);
	}
	subscribe(key: string | readonly unknown[]): void {
		this.cache.subscribe(key);
	}
	unsubscribe(key: string | readonly unknown[], gcTime: number): void {
		this.cache.unsubscribe(key, gcTime);
	}

	// 기존 fetchFn 방식
	async prefetchQuery<T = unknown>(key: string | readonly unknown[], fetchFn: () => Promise<T>): Promise<T>;

	// QueryConfig 방식 (오버로드)
	async prefetchQuery<T = unknown>(query: QueryConfig<any, any>, params: any): Promise<T>;

	// 구현
	async prefetchQuery<T = unknown>(
		keyOrQuery: string | readonly unknown[] | QueryConfig<any, any>,
		fetchFnOrParams: (() => Promise<T>) | any,
	): Promise<T> {
		// QueryConfig 방식인지 확인
		if (typeof keyOrQuery === "object" && keyOrQuery && "cacheKey" in keyOrQuery) {
			const query = keyOrQuery as QueryConfig<any, any>;
			const params = fetchFnOrParams;
			const cacheKey = query.cacheKey(params);

			const fetchFn = async (): Promise<T> => {
				let data: any;

				// queryFn이 있는 경우 커스텀 함수 사용
				if (query.queryFn) {
					data = await query.queryFn(params, this.fetcher);
				} else if (query.url) {
					// 기존 URL 기반 방식
					const url = query.url(params);
					const response = await this.fetcher.get(url, query.fetchConfig);
					data = response.data;
				} else {
					throw new Error("Either 'url' or 'queryFn' must be provided in QueryConfig");
				}

				// 스키마 검증
				if (query.schema) {
					data = query.schema.parse(data);
				}

				// select 처리
				if (query.select) {
					data = query.select(data);
				}

				return data;
			};

			return this.prefetchQuery(cacheKey, fetchFn);
		}

		// 기존 fetchFn 방식
		const key = keyOrQuery as string | readonly unknown[];
		const fetchFn = fetchFnOrParams as () => Promise<T>;

		const data = await fetchFn();
		this.set(key, {
			data,
			error: undefined,
			isLoading: false,
			isFetching: false,
			updatedAt: Date.now(),
		});
		return data;
	}

	dehydrate(): Record<string, QueryState> {
		return this.cache.serialize();
	}

	hydrate(cache: Record<string, QueryState>): void {
		this.cache.deserialize(cache);
	}

	/**
	 * 캐시 통계를 반환합니다. (디버깅 목적)
	 *
	 * @description 성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
	 */
	getQueryCache() {
		return this.cache;
	}
}
