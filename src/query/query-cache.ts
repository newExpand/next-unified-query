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
export type QueryState<T = unknown> = {
  data?: T | React.ReactNode;
  error?: unknown;
  isLoading: boolean;
  isFetching: boolean;
  updatedAt: number;
  isPlaceholderData?: boolean;
};

/**
 * 쿼리 캐시 클래스
 */
export class QueryCache {
  private cache = new Map<string, QueryState>();
  private subscribers = new Map<string, number>();
  private listeners = new Map<string, Set<() => void>>();
  private cacheTimers = new Map<string, NodeJS.Timeout>();

  set(key: string | readonly unknown[], state: QueryState) {
    const sKey = serializeQueryKey(key);
    this.cache.set(sKey, state);
    this.notifyListeners(sKey);
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
    this.listeners.delete(sKey);
    const timer = this.cacheTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.cacheTimers.delete(sKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
    this.listeners.clear();
    this.cacheTimers.forEach((timer, key) => {
      clearTimeout(timer);
    });
    this.cacheTimers.clear();
  }

  getAll(): Record<string, QueryState> {
    return Object.fromEntries(this.cache.entries());
  }

  /**
   * 컴포넌트가 쿼리를 구독하여 refetch 콜백을 등록합니다.
   * @returns unsubscribe 함수
   */
  subscribeListener(
    key: string | readonly unknown[],
    listener: () => void
  ): () => void {
    const sKey = serializeQueryKey(key);
    if (!this.listeners.has(sKey)) {
      this.listeners.set(sKey, new Set());
    }
    this.listeners.get(sKey)!.add(listener);

    return () => {
      this.listeners.get(sKey)?.delete(listener);
    };
  }

  /**
   * 특정 쿼리 키의 모든 리스너에게 알림을 보냅니다.
   */
  notifyListeners(key: string | readonly unknown[]): void {
    const sKey = serializeQueryKey(key);
    Promise.resolve().then(() => {
      this.listeners.get(sKey)?.forEach((l) => l());
    });
  }

  /**
   * 구독자 수 증가 및 cacheTime 타이머 해제 (GC 목적)
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

  serialize(): Record<string, QueryState> {
    return this.getAll();
  }

  deserialize(cache: Record<string, QueryState>): void {
    Object.entries(cache).forEach(([key, state]) => {
      this.cache.set(key, state);
    });
  }
}
