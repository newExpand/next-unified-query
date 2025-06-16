import { isString } from "es-toolkit/predicate";
import { isArray } from "es-toolkit/compat";
import QuickLRU from "quick-lru";

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
  data?: T;
  error?: unknown;
  isLoading: boolean;
  isFetching: boolean;
  updatedAt: number;
};

/**
 * QueryCache 옵션
 */
export interface QueryCacheOptions {
  /**
   * 메모리 보호를 위한 최대 쿼리 수 (하드 리미트)
   * 이 수를 초과하면 LRU(Least Recently Used) 알고리즘으로 가장 오래된 쿼리부터 즉시 제거됩니다.
   * gcTime과는 별개로 동작하며, 메모리 사용량을 제한하는 안전장치 역할을 합니다.
   * @default 1000
   */
  maxQueries?: number;
}

/**
 * 타이머 타입 (브라우저/Node.js 호환)
 */
type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * 쿼리 캐시 클래스
 *
 * 두 가지 캐시 전략을 사용합니다:
 * 1. **메모리 보호 (Hard Limit)**: maxQueries로 설정된 수를 초과하면 LRU 알고리즘으로 즉시 제거
 * 2. **생명주기 관리 (Soft Limit)**: 구독자가 0이 된 후 gcTime 시간이 지나면 가비지 컬렉션으로 제거
 */
export class QueryCache {
  private cache: QuickLRU<string, QueryState>;
  private subscribers = new Map<string, number>();
  private listeners = new Map<string, Set<() => void>>();
  private gcTimers = new Map<string, TimerHandle>();

  constructor(options: QueryCacheOptions = {}) {
    const { maxQueries = 1000 } = options;
    this.cache = new QuickLRU({
      maxSize: maxQueries,
      onEviction: (key: string, value: QueryState) => {
        // LRU에 의해 자동 제거될 때 메타데이터도 함께 정리
        this.cleanupMetadata(key);
      },
    });
  }

  /**
   * 특정 키의 메타데이터를 정리합니다.
   */
  private cleanupMetadata(sKey: string): void {
    this.subscribers.delete(sKey);
    this.listeners.delete(sKey);
    const timer = this.gcTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.gcTimers.delete(sKey);
    }
  }

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
    this.cleanupMetadata(sKey);
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
    this.listeners.clear();
    this.gcTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.gcTimers.clear();
  }

  getAll(): Record<string, QueryState> {
    const result: Record<string, QueryState> = {};
    for (const [key, value] of this.cache.entries()) {
      result[key] = value;
    }
    return result;
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
      const listenerSet = this.listeners.get(sKey);
      if (listenerSet) {
        listenerSet.delete(listener);
        // 빈 Set이 되면 메모리 절약을 위해 제거
        if (listenerSet.size === 0) {
          this.listeners.delete(sKey);
        }
      }
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
   * 구독자 수 증가 및 gcTime 타이머 해제 (생명주기 관리)
   */
  subscribe(key: string | readonly unknown[]): void {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    this.subscribers.set(sKey, prev + 1);
    const timer = this.gcTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.gcTimers.delete(sKey);
    }
  }

  /**
   * 구독자 수 감소 및 0이 되면 gcTime 타이머 시작 (생명주기 관리)
   */
  unsubscribe(key: string | readonly unknown[], gcTime: number): void {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    if (prev <= 1) {
      this.subscribers.set(sKey, 0);
      const timer = setTimeout(() => {
        this.delete(key);
      }, gcTime);
      this.gcTimers.set(sKey, timer);
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

  /**
   * 현재 캐시 크기를 반환합니다.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 캐시의 최대 크기를 반환합니다.
   */
  get maxSize(): number {
    return this.cache.maxSize;
  }

  /**
   * 캐시 통계를 반환합니다.
   *
   * @description 디버깅 및 모니터링 목적으로 사용됩니다.
   * 성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
   *
   * @example
   * ```typescript
   * const queryClient = useQueryClient();
   * const stats = queryClient.getQueryCache().getStats();
   * console.log('Current cache size:', stats.cacheSize);
   * console.log('Active GC timers:', stats.activeGcTimersCount);
   * ```
   */
  getStats() {
    return {
      /** 현재 캐시된 쿼리 수 */
      cacheSize: this.cache.size,
      /** 최대 쿼리 수 (메모리 보호 한계) */
      maxSize: this.cache.maxSize,
      /** 활성 구독자 수 */
      subscribersCount: this.subscribers.size,
      /** 등록된 리스너 수 */
      listenersCount: this.listeners.size,
      /** 활성 GC 타이머 수 (생명주기 관리 중인 쿼리) */
      activeGcTimersCount: this.gcTimers.size,
    };
  }
}
