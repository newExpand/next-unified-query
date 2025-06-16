import { QueryCache } from "../cache/query-cache";
import type { QueryState, QueryCacheOptions } from "../cache/query-cache";
import { isArray, isString, forEach, isEqual } from "es-toolkit/compat";
import { createFetch } from "../../core/client";
import type { FetchConfig, NextTypeFetch } from "../../types/index";

export interface QueryClientOptions extends FetchConfig {
  fetcher?: NextTypeFetch;
  /**
   * QueryCache 옵션
   */
  queryCache?: QueryCacheOptions;
}

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
  get<T = unknown>(
    key: string | readonly unknown[]
  ): QueryState<T> | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * 쿼리 상태 저장
   */
  set(key: string | readonly unknown[], state: QueryState): void {
    this.cache.set(key, state);
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
          if (
            Array.isArray(keyArr) &&
            isEqual(keyArr.slice(0, prefixArr.length), prefixArr)
          ) {
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
  subscribeListener(
    key: string | readonly unknown[],
    listener: () => void
  ): () => void {
    return this.cache.subscribeListener(key, listener);
  }
  subscribe(key: string | readonly unknown[]): void {
    this.cache.subscribe(key);
  }
  unsubscribe(key: string | readonly unknown[], gcTime: number): void {
    this.cache.unsubscribe(key, gcTime);
  }

  async prefetchQuery<T = unknown>(
    key: string | readonly unknown[],
    fetchFn: () => Promise<T>
  ): Promise<T> {
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
