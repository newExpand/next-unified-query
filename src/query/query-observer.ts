import type { QueryClient } from "./query-client";
import type { QueryState } from "./query-cache";
import { serializeQueryKey } from "./query-cache";
import type { FetchConfig } from "../types/index";
import { merge } from "es-toolkit/object";
import { isNotNil, isFunction } from "es-toolkit/predicate";
import type { ZodType } from "zod/v4";

export interface QueryObserverOptions<T = any> {
  key: readonly unknown[];
  url: string;
  params?: Record<string, any>;
  schema?: ZodType;
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
  placeholderData?:
    | T
    | React.ReactNode
    | ((
        prevData: T | React.ReactNode | undefined,
        prevQuery?: QueryState<T> | undefined
      ) => T | React.ReactNode);
  gcTime?: number;
}

export interface QueryObserverResult<T = unknown, E = unknown> {
  data?: T;
  error?: E;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  isStale: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}

/**
 * TanStack Query v5: Tracked Properties 구현
 * Proxy를 사용하여 실제 사용된 속성만 추적
 */
class TrackedResult<T = unknown, E = unknown> {
  private trackedProps = new Set<keyof QueryObserverResult<T, E>>();
  private result: QueryObserverResult<T, E>;

  constructor(result: QueryObserverResult<T, E>) {
    this.result = result;
  }

  createProxy(): QueryObserverResult<T, E> {
    return new Proxy(this.result, {
      get: (target, prop) => {
        // 속성 접근 추적
        if (typeof prop === "string" && prop in target) {
          this.trackedProps.add(prop as keyof QueryObserverResult<T, E>);
        }
        return target[prop as keyof QueryObserverResult<T, E>];
      },
    });
  }

  getTrackedProps(): Set<keyof QueryObserverResult<T, E>> {
    return this.trackedProps;
  }

  hasTrackedProp(prop: keyof QueryObserverResult<T, E>): boolean {
    return this.trackedProps.has(prop);
  }
}

/**
 * TanStack Query v5 Observer 패턴 구현
 * placeholderData는 캐시와 완전히 분리하여 UI 레벨에서만 관리
 */
export class QueryObserver<T = unknown, E = unknown> {
  private queryClient: QueryClient;
  private options: QueryObserverOptions<T>;
  private listeners = new Set<() => void>();
  private cacheKey: string;
  private isDestroyed = false;
  private currentResult: QueryObserverResult<T, E>;
  private optionsHash: string = "";

  // placeholderData는 캐시와 완전히 분리된 UI 상태
  private placeholderState: {
    data: any;
    isActive: boolean;
  } | null = null;

  // TanStack Query v5: 결과 캐싱으로 불필요한 렌더링 방지
  private lastResultReference: QueryObserverResult<T, E> | null = null;

  // TanStack Query v5: Tracked Properties
  private trackedResult: TrackedResult<T, E> | null = null;

  constructor(queryClient: QueryClient, options: QueryObserverOptions<T>) {
    this.queryClient = queryClient;
    this.options = options;
    this.cacheKey = serializeQueryKey(options.key);
    this.optionsHash = this.createOptionsHash(options);

    // 초기 결과 계산 (placeholderData 고려)
    this.currentResult = this.computeResult();

    // 캐시 변경 구독
    this.subscribeToCache();

    // 초기 fetch 실행
    this.executeFetch();
  }

  private createOptionsHash(options: QueryObserverOptions<T>): string {
    const hashableOptions = {
      key: options.key,
      url: options.url,
      params: options.params,
      enabled: options.enabled,
      staleTime: options.staleTime,
      gcTime: options.gcTime,
    };
    return JSON.stringify(hashableOptions);
  }

  /**
   * TanStack Query v5 방식: placeholderData 계산
   * 캐시와 완전히 독립적으로 처리
   */
  private computePlaceholderData(): any {
    const { placeholderData } = this.options;

    if (!placeholderData) return undefined;

    // 이전 쿼리 데이터 찾기
    const prevQuery = this.findPreviousQuery();

    if (!prevQuery || prevQuery.data === undefined) return undefined;

    return isFunction(placeholderData)
      ? placeholderData(prevQuery.data, prevQuery)
      : placeholderData;
  }

  private findPreviousQuery(): QueryState<T> | undefined {
    const allQueries = this.queryClient.getAll();
    const currentKey = this.options.key;

    let mostRecentQuery: QueryState<T> | undefined;
    let mostRecentTime = 0;

    for (const [keyStr, state] of Object.entries(allQueries)) {
      try {
        const keyArray = JSON.parse(keyStr);
        if (Array.isArray(keyArray) && Array.isArray(currentKey)) {
          const isSameType = keyArray[0] === currentKey[0];
          const isDifferentKey =
            JSON.stringify(keyArray) !== JSON.stringify(currentKey);
          const hasData = state && (state as QueryState<T>).data !== undefined;
          const updatedAt = (state as QueryState<T>).updatedAt || 0;

          if (
            isSameType &&
            isDifferentKey &&
            hasData &&
            updatedAt > mostRecentTime
          ) {
            mostRecentQuery = state as QueryState<T>;
            mostRecentTime = updatedAt;
          }
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    return mostRecentQuery;
  }

  private subscribeToCache(): void {
    this.queryClient.subscribeListener(this.options.key, () => {
      if (!this.isDestroyed) {
        const hasChanged = this.updateResult();
        if (hasChanged) {
          this.scheduleNotifyListeners();
        }
      }
    });

    this.queryClient.subscribe(this.options.key);
  }

  /**
   * TanStack Query v5 방식: 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  private computeResult(): QueryObserverResult<T, E> {
    const cached = this.queryClient.get<T>(this.cacheKey);
    const hasCache = !!cached;

    // 1. 캐시된 데이터가 있는 경우: placeholderData 무시
    if (hasCache) {
      const finalData = this.applySelect(cached.data);
      const isStale = this.computeStaleTime(cached.updatedAt);

      return {
        data: finalData,
        error: cached.error as E,
        isLoading: cached.isLoading,
        isFetching: cached.isFetching,
        isError: !!cached.error,
        isSuccess:
          !cached.isLoading && !cached.error && cached.data !== undefined,
        isStale,
        isPlaceholderData: false, // 캐시된 데이터는 항상 false
        refetch: () => this.refetch(),
      };
    }

    // 2. 캐시가 없는 경우: placeholderData 확인
    const placeholderData = this.computePlaceholderData();
    const hasPlaceholder = placeholderData !== undefined;

    if (hasPlaceholder) {
      // placeholderData가 있는 경우: success 상태로 시작
      this.placeholderState = {
        data: placeholderData!,
        isActive: true,
      };

      const finalData = this.applySelect(placeholderData as T);

      return {
        data: finalData,
        error: undefined,
        isLoading: false, // TanStack Query v5: placeholderData는 success 상태
        isFetching: true, // 백그라운드에서 fetch 중
        isError: false,
        isSuccess: true,
        isStale: true,
        isPlaceholderData: true,
        refetch: () => this.refetch(),
      };
    }

    // 3. 캐시도 placeholderData도 없는 경우: 초기 loading 상태
    this.placeholderState = null;

    return {
      data: undefined,
      error: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      isStale: true,
      isPlaceholderData: false,
      refetch: () => this.refetch(),
    };
  }

  private applySelect(data: T | React.ReactNode | undefined): T | undefined {
    if (!data || !this.options.select) return data as T;

    try {
      return this.options.select(data as T);
    } catch {
      return data as T;
    }
  }

  private computeStaleTime(updatedAt: number): boolean {
    return updatedAt
      ? Date.now() - updatedAt >= (this.options.staleTime || 0)
      : true;
  }

  /**
   * TanStack Query v5: Tracked Properties 기반 결과 업데이트
   * 항상 tracked 모드로 동작
   */
  private updateResult(): boolean {
    const newResult = this.computeResult();

    // TanStack Query v5: 실제 사용된 속성만 확인
    if (this.hasChangeInTrackedProps(newResult)) {
      this.currentResult = newResult;
      this.lastResultReference = newResult;
      return true;
    }

    return false;
  }

  private hasChangeInTrackedProps(
    newResult: QueryObserverResult<T, E>
  ): boolean {
    if (!this.lastResultReference) return true;
    if (!this.trackedResult) return true;

    const trackedProps = this.trackedResult.getTrackedProps();

    // 추적된 속성이 없으면 변경사항 없음으로 간주
    if (trackedProps.size === 0) return false;

    // 추적된 속성 중 하나라도 변경되었으면 알림
    for (const prop of trackedProps) {
      if (this.lastResultReference[prop] !== newResult[prop]) {
        return true;
      }
    }

    return false;
  }

  private async executeFetch(): Promise<void> {
    const { enabled = true, staleTime = 0 } = this.options;

    if (!enabled) return;

    const cached = this.queryClient.get<T>(this.cacheKey);
    const isStale = cached ? Date.now() - cached.updatedAt >= staleTime : true;

    if (!cached || isStale) {
      await this.fetchData();
    }
  }

  private async fetchData(): Promise<void> {
    try {
      // fetch 시작 상태 설정
      const currentState = this.queryClient.get<T>(this.cacheKey);
      if (currentState) {
        this.queryClient.set(this.cacheKey, {
          ...currentState,
          isFetching: true,
        });
      }

      // fetch 설정 구성
      const fetcher = this.queryClient.getFetcher();
      let config: FetchConfig = merge({}, this.options.fetchConfig ?? {});

      if (isNotNil(this.options.params)) {
        config = merge(config, { params: this.options.params });
      }
      if (isNotNil(this.options.schema)) {
        config = merge(config, { schema: this.options.schema });
      }

      // 데이터 fetch
      const response = await fetcher.get(
        this.options.url,
        config as FetchConfig
      );
      let result = response.data as T;

      // 스키마 검증
      if (this.options.schema) {
        result = this.options.schema.parse(result) as T;
      }

      // 성공 상태 저장 - placeholderData 비활성화
      this.placeholderState = null;

      this.queryClient.set(this.cacheKey, {
        data: result,
        error: undefined,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      // 에러 상태 저장 - placeholderData 비활성화
      this.placeholderState = null;

      this.queryClient.set(this.cacheKey, {
        data: undefined as T | undefined,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 결과 구독 (React 컴포넌트에서 사용)
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * TanStack Query v5: Tracked Properties가 적용된 현재 결과 반환
   * 항상 Proxy로 래핑하여 속성 접근 추적
   */
  getCurrentResult(): QueryObserverResult<T, E> {
    // 항상 tracked 모드로 동작: Proxy로 래핑하여 속성 접근 추적
    this.trackedResult = new TrackedResult(this.currentResult);
    return this.trackedResult.createProxy();
  }

  /**
   * 수동 refetch
   */
  refetch(): void {
    this.fetchData();
  }

  /**
   * TanStack Query v5: 옵션 업데이트 최적화
   */
  setOptions(options: QueryObserverOptions<T>): void {
    const prevKey = this.cacheKey;
    const prevHash = this.optionsHash;
    const newHash = this.createOptionsHash(options);

    // 해시가 동일한 경우 함수만 업데이트
    if (prevHash === newHash) {
      this.options = options;
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
      return;
    }

    const prevOptions = this.options;
    this.options = options;
    this.cacheKey = serializeQueryKey(options.key);
    this.optionsHash = newHash;

    // 키가 변경된 경우
    const keyChanged = prevKey !== this.cacheKey;

    if (keyChanged) {
      // 이전 구독 해제
      this.queryClient.unsubscribe(
        prevOptions.key,
        prevOptions.gcTime || 300000
      );

      // placeholderData 상태 초기화
      this.placeholderState = null;
      // Tracked Properties 초기화
      this.trackedResult = null;

      // 새 키로 구독
      this.subscribeToCache();

      // TanStack Query v5: 캐시된 데이터 최적화 처리
      const hasCachedData = this.queryClient.has(this.cacheKey);

      if (hasCachedData) {
        // 캐시된 데이터가 있는 경우: 즉시 표시, 알림 없음 (단일 렌더링)
        const hasChanged = this.updateResult();
        this.executeFetch(); // 백그라운드 업데이트만

        // TanStack Query v5: 캐시된 페이지는 알림하지 않음
        // 이미 데이터가 있으므로 추가 렌더링 불필요
      } else {
        // 캐시가 없는 경우: placeholderData 사용 가능
        const hasChanged = this.updateResult();
        this.executeFetch();

        if (hasChanged) {
          this.scheduleNotifyListeners();
        }
      }
    } else {
      // 키는 같지만 다른 옵션이 변경된 경우
      const hasChanged = this.updateResult();
      this.executeFetch();

      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
    }
  }

  private scheduleNotifyListeners(): void {
    Promise.resolve().then(() => {
      if (!this.isDestroyed) {
        this.notifyListeners();
      }
    });
  }

  /**
   * Observer 정리
   */
  destroy(): void {
    this.isDestroyed = true;
    this.queryClient.unsubscribe(
      this.options.key,
      this.options.gcTime || 300000
    );
    this.listeners.clear();
    this.placeholderState = null;
    this.lastResultReference = null;
    this.trackedResult = null;
  }
}
