/**
 * 쿼리키를 직렬화하여 string으로 변환합니다.
 * @param key 쿼리키(배열 또는 문자열)
 */
export function serializeQueryKey(key: string | readonly unknown[]): string {
  return Array.isArray(key) ? JSON.stringify(key) : String(key);
}

/**
 * 쿼리 상태 타입
 */
export type QueryState<T = any> = {
  data?: T;
  error?: unknown;
  isLoading: boolean;
  updatedAt: number;
};

/**
 * 쿼리 캐시 클래스
 */
export class QueryCache {
  private cache = new Map<string, QueryState>();

  set(key: string | readonly unknown[], state: QueryState) {
    this.cache.set(serializeQueryKey(key), state);
  }

  get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined {
    return this.cache.get(serializeQueryKey(key)) as QueryState<T> | undefined;
  }

  has(key: string | readonly unknown[]): boolean {
    return this.cache.has(serializeQueryKey(key));
  }

  delete(key: string | readonly unknown[]): void {
    this.cache.delete(serializeQueryKey(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getAll(): Record<string, QueryState> {
    return Object.fromEntries(this.cache.entries());
  }
}

/**
 * 싱글톤 쿼리 캐시 인스턴스
 */
export const queryCache = new QueryCache();
