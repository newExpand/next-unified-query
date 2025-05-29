import { isString } from "es-toolkit/predicate";
import { isArray } from "es-toolkit/compat";

/**
 * 쿼리키를 직렬화하여 string으로 변환합니다.
 * @param key 쿼리키(배열 또는 문자열)
 */
export function serializeQueryKey(key: string | readonly unknown[]): string {
  return isArray(key) ? JSON.stringify(key) : isString(key) ? key : String(key);
}

/**
 * 쿼리 상태 타입
 */
export type QueryState<T = any> = {
  data?: T | React.ReactNode;
  error?: unknown;
  isLoading: boolean;
  updatedAt: number;
};

/**
 * 쿼리 캐시 클래스
 */
export class QueryCache {
  private cache = new Map<string, QueryState>();
  private subscribers = new Map<string, number>();
  private cacheTimers = new Map<string, NodeJS.Timeout>();

  set(key: string | readonly unknown[], state: QueryState) {
    this.cache.set(serializeQueryKey(key), state);
  }

  get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined {
    const result = this.cache.get(serializeQueryKey(key)) as
      | QueryState<T>
      | undefined;
    return result;
  }

  has(key: string | readonly unknown[]): boolean {
    const result = this.cache.has(serializeQueryKey(key));
    return result;
  }

  delete(key: string | readonly unknown[]): void {
    const sKey = serializeQueryKey(key);
    this.cache.delete(sKey);
    this.subscribers.delete(sKey);
    const timer = this.cacheTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.cacheTimers.delete(sKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
    this.cacheTimers.forEach((timer, key) => {
      clearTimeout(timer);
    });
    this.cacheTimers.clear();
  }

  getAll(): Record<string, QueryState> {
    return Object.fromEntries(this.cache.entries());
  }

  /**
   * 구독자 수 증가 및 cacheTime 타이머 해제
   */
  subscribe(key: string | readonly unknown[]): void {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    this.subscribers.set(sKey, prev + 1);
    const timer = this.cacheTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.cacheTimers.delete(sKey);
    }
  }

  /**
   * 구독자 수 감소 및 0이 되면 cacheTime 타이머 시작
   */
  unsubscribe(key: string | readonly unknown[], cacheTime: number): void {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    if (prev <= 1) {
      this.subscribers.set(sKey, 0);
      const timer = setTimeout(() => {
        this.delete(key);
      }, cacheTime);
      this.cacheTimers.set(sKey, timer);
    } else {
      this.subscribers.set(sKey, prev - 1);
    }
  }
}

/**
 * 싱글톤 쿼리 캐시 인스턴스
 */
export const queryCache = new QueryCache();
