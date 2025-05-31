import { QueryCache } from "./query-cache";
import type { QueryState } from "./query-cache";
import { isArray, isString, forEach, isEqual } from "es-toolkit/compat";
import { createFetch } from "../core/client";
import type { FetchConfig, NextTypeFetch } from "../types/index";

export interface QueryClientOptions extends FetchConfig {}

export class QueryClient {
  private cache: QueryCache;
  private fetcher: NextTypeFetch;

  constructor(options?: QueryClientOptions) {
    this.cache = new QueryCache();
    this.fetcher = createFetch(options);
  }

  getFetcher() {
    return this.fetcher;
  }

  /**
   * 쿼리 상태 조회
   */
  get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined {
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
            this.cache.delete(key);
          }
        } catch {
          // string key는 무시
        }
      });
    } else {
      const prefixStr = isString(prefix) ? prefix : String(prefix);
      forEach(Object.keys(all), (key) => {
        if (key.startsWith(prefixStr)) {
          this.cache.delete(key);
        }
      });
    }
  }

  /**
   * 구독자 관리 (public)
   */
  subscribe(key: string | readonly unknown[]): void {
    this.cache.subscribe(key);
  }
  unsubscribe(key: string | readonly unknown[], cacheTime: number): void {
    this.cache.unsubscribe(key, cacheTime);
  }

  async prefetchQuery<T>(
    key: string | readonly unknown[],
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const data = await fetchFn();
    this.set(key, {
      data,
      error: undefined,
      isLoading: false,
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
}
