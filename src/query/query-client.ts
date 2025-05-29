import { queryCache } from "./query-cache";
import type { QueryState } from "./query-cache";
import { isArray, isString, forEach, isEqual } from "es-toolkit/compat";

export class QueryClient {
  /**
   * 쿼리 상태 조회
   */
  get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined {
    return queryCache.get<T>(key);
  }

  /**
   * 쿼리 상태 저장
   */
  set(key: string | readonly unknown[], state: QueryState): void {
    queryCache.set(key, state);
  }

  /**
   * 쿼리 상태 삭제
   */
  delete(key: string | readonly unknown[]): void {
    queryCache.delete(key);
  }

  /**
   * 모든 쿼리 상태 반환
   */
  getAll(): Record<string, QueryState> {
    return queryCache.getAll();
  }

  /**
   * 모든 쿼리 상태 초기화
   */
  clear(): void {
    queryCache.clear();
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
            queryCache.delete(key);
          }
        } catch {
          // string key는 무시
        }
      });
    } else {
      const prefixStr = isString(prefix) ? prefix : String(prefix);
      forEach(Object.keys(all), (key) => {
        if (key.startsWith(prefixStr)) {
          queryCache.delete(key);
        }
      });
    }
  }

  /**
   * 구독자 관리 (public)
   */
  subscribe(key: string | readonly unknown[]): void {
    queryCache.subscribe(key);
  }
  unsubscribe(key: string | readonly unknown[], cacheTime: number): void {
    queryCache.unsubscribe(key, cacheTime);
  }
}
