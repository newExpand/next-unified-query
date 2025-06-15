import type { QueryClient } from "./query-client";
import type { QueryState } from "./query-cache";
import { serializeQueryKey } from "./query-cache";
import type { FetchConfig } from "../types/index";
import { isNotNil } from "es-toolkit/predicate";
import {
  isEqual,
  isPlainObject,
  keys,
  isArray,
  pick,
  isEmpty,
  isNil,
  merge,
  isFunction,
} from "es-toolkit/compat";
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
  private cachedProxy: QueryObserverResult<T, E> | null = null;

  constructor(result: QueryObserverResult<T, E>) {
    this.result = result;
  }

  createProxy(): QueryObserverResult<T, E> {
    // 이미 캐시된 Proxy가 있으면 재사용
    if (this.cachedProxy) {
      return this.cachedProxy;
    }

    this.cachedProxy = new Proxy(this.result, {
      get: (target, prop) => {
        // 속성 접근 추적
        if (typeof prop === "string" && prop in target) {
          this.trackedProps.add(prop as keyof QueryObserverResult<T, E>);
        }
        return target[prop as keyof QueryObserverResult<T, E>];
      },
    });

    return this.cachedProxy;
  }

  getTrackedProps(): Set<keyof QueryObserverResult<T, E>> {
    return this.trackedProps;
  }

  hasTrackedProp(prop: keyof QueryObserverResult<T, E>): boolean {
    return this.trackedProps.has(prop);
  }

  getResult(): QueryObserverResult<T, E> {
    return this.result;
  }

  // 결과가 변경될 때 캐시 무효화
  updateResult(newResult: QueryObserverResult<T, E>): void {
    this.result = newResult;
    this.cachedProxy = null; // 캐시 무효화
  }
}

/**
 * TanStack Query v5: Structural Sharing 구현
 * es-toolkit/compat 함수들을 사용한 참조 안정성 최적화
 */
function replaceEqualDeep<T>(prev: T, next: T): T {
  // 1. 참조 동일성 체크 (가장 빠른 경로)
  if (prev === next) {
    return prev;
  }

  // 2. 깊은 비교로 값이 같으면 이전 참조 유지 (Structural Sharing)
  if (isEqual(prev, next)) {
    return prev;
  }

  // 3. null/undefined 처리
  if (prev == null || next == null) {
    return next;
  }

  // 4. 배열 처리
  if (isArray(prev) && isArray(next)) {
    if (prev.length !== next.length) {
      return next;
    }

    let hasChanged = false;
    const result = prev.map((item, index) => {
      const nextItem = replaceEqualDeep(item, next[index]);
      if (nextItem !== item) {
        hasChanged = true;
      }
      return nextItem;
    });

    return hasChanged ? (result as T) : prev;
  }

  // 5. 배열과 비배열 타입이 섞인 경우
  if (isArray(prev) !== isArray(next)) {
    return next;
  }

  // 6. 순수 객체 처리
  if (isPlainObject(prev) && isPlainObject(next)) {
    const prevObj = prev as Record<string, unknown>;
    const nextObj = next as Record<string, unknown>;
    const prevKeys = keys(prevObj);
    const nextKeys = keys(nextObj);

    // 키 개수가 다르면 새 객체 반환
    if (prevKeys.length !== nextKeys.length) {
      return next;
    }

    let hasChanged = false;
    const result: Record<string, unknown> = {};

    for (const key of nextKeys) {
      // 이전 객체에 키가 없으면 새 객체 반환
      if (!(key in prevObj)) {
        return next;
      }

      const prevValue = prevObj[key];
      const nextValue = nextObj[key];
      const optimizedValue = replaceEqualDeep(prevValue, nextValue);

      if (optimizedValue !== prevValue) {
        hasChanged = true;
      }
      result[key] = optimizedValue;
    }

    return hasChanged ? (result as T) : prev;
  }

  // 7. 객체가 아닌 경우 또는 다른 타입의 객체인 경우
  return next;
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
    // pick을 사용하여 해시에 포함할 속성들만 선택
    const hashableOptions = pick(options, [
      "key",
      "url",
      "params",
      "enabled",
      "staleTime",
      "gcTime",
    ]);
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

        if (this.isValidPreviousQuery(keyArray, currentKey, state)) {
          const updatedAt = (state as QueryState<T>).updatedAt || 0;

          if (this.isMoreRecent(updatedAt, mostRecentTime)) {
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

  private isValidPreviousQuery(
    keyArray: any,
    currentKey: readonly unknown[],
    state: any
  ): boolean {
    return (
      this.isArrayKey(keyArray) &&
      this.isSameQueryType(keyArray, currentKey) &&
      this.isDifferentQueryKey(keyArray, currentKey) &&
      this.hasValidData(state)
    );
  }

  private isArrayKey(keyArray: any): boolean {
    return Array.isArray(keyArray) && Array.isArray(this.options.key);
  }

  private isSameQueryType(
    keyArray: any[],
    currentKey: readonly unknown[]
  ): boolean {
    return keyArray[0] === currentKey[0];
  }

  private isDifferentQueryKey(
    keyArray: any[],
    currentKey: readonly unknown[]
  ): boolean {
    return !isEqual(keyArray, currentKey);
  }

  private hasValidData(state: any): boolean {
    return state && !isNil((state as QueryState<T>).data);
  }

  private isMoreRecent(updatedAt: number, mostRecentTime: number): boolean {
    return updatedAt > mostRecentTime;
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
   * 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  private computeResult(): QueryObserverResult<T, E> {
    const cached = this.queryClient.get<T>(this.cacheKey);

    // 1. 캐시된 데이터가 있는 경우
    if (this.hasCachedData(cached)) {
      return this.createCachedResult(cached!);
    }

    // 2. 캐시가 없는 경우: placeholderData 확인
    const placeholderData = this.computePlaceholderData();
    if (this.hasValidPlaceholderData(placeholderData)) {
      return this.createPlaceholderResult(placeholderData!);
    }

    // 3. 캐시도 placeholderData도 없는 경우: 초기 loading 상태
    return this.createInitialLoadingResult();
  }

  private hasCachedData(cached: QueryState<T> | undefined): boolean {
    return !!cached;
  }

  private hasValidPlaceholderData(placeholderData: any): boolean {
    return !isNil(placeholderData);
  }

  private createCachedResult(cached: QueryState<T>): QueryObserverResult<T, E> {
    const finalData = this.applySelect(cached.data);
    const isStale = this.computeStaleTime(cached.updatedAt);

    return {
      data: finalData,
      error: cached.error as E,
      isLoading: cached.isLoading,
      isFetching: cached.isFetching, // 캐시된 상태의 isFetching 값 사용
      isError: !!cached.error,
      isSuccess: this.isSuccessState(cached),
      isStale,
      isPlaceholderData: false, // 캐시된 데이터는 항상 false
      refetch: () => this.refetch(),
    };
  }

  private createPlaceholderResult(
    placeholderData: any
  ): QueryObserverResult<T, E> {
    // placeholderData가 있는 경우: success 상태로 시작
    this.placeholderState = {
      data: placeholderData,
      isActive: true,
    };

    const finalData = this.applySelect(placeholderData as T);

    return {
      data: finalData,
      error: undefined,
      isLoading: false, // placeholderData는 success 상태
      isFetching: true, // 백그라운드에서 fetch 중
      isError: false,
      isSuccess: true,
      isStale: true,
      isPlaceholderData: true,
      refetch: () => this.refetch(),
    };
  }

  private createInitialLoadingResult(): QueryObserverResult<T, E> {
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

  private isSuccessState(cached: QueryState<T>): boolean {
    return !cached.isLoading && !cached.error && !isNil(cached.data);
  }

  private applySelect(data: T | React.ReactNode | undefined): T | undefined {
    if (isNil(data) || !this.options.select) return data as T;

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
   * Tracked Properties 기반 결과 업데이트
   * 기본적으로 tracked 모드로 동작
   */
  private updateResult(): boolean {
    const newResult = this.computeResult();

    // Structural Sharing 적용
    const optimizedResult = this.applyStructuralSharing(newResult);

    // 'tracked' 모드: 실제 사용된 속성만 확인
    if (this.hasChangeInTrackedProps(optimizedResult)) {
      this.currentResult = optimizedResult;
      this.lastResultReference = optimizedResult;
      return true;
    }

    return false;
  }

  /**
   * Structural Sharing 적용
   */
  private applyStructuralSharing(
    newResult: QueryObserverResult<T, E>
  ): QueryObserverResult<T, E> {
    if (!this.lastResultReference) {
      return newResult;
    }

    return replaceEqualDeep(this.lastResultReference, newResult);
  }

  private hasChangeInTrackedProps(
    newResult: QueryObserverResult<T, E>
  ): boolean {
    // 초기 상태 확인
    if (this.isInitialState()) {
      return true;
    }

    const trackedProps = this.trackedResult!.getTrackedProps();

    // 추적된 속성이 없으면 초기 상태로 간주
    if (this.hasNoTrackedProperties(trackedProps)) {
      return true;
    }

    // 추적된 속성 중 변경된 것이 있는지 확인
    return this.hasTrackedPropertyChanged(trackedProps, newResult);
  }

  private isInitialState(): boolean {
    return !this.lastResultReference || !this.trackedResult;
  }

  private hasNoTrackedProperties(
    trackedProps: Set<keyof QueryObserverResult<T, E>>
  ): boolean {
    return isEmpty(trackedProps);
  }

  private hasTrackedPropertyChanged(
    trackedProps: Set<keyof QueryObserverResult<T, E>>,
    newResult: QueryObserverResult<T, E>
  ): boolean {
    for (const prop of trackedProps) {
      if (this.lastResultReference![prop] !== newResult[prop]) {
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
      // fetch 설정이 이미 handleCachedDataAvailable에서 처리되었는지 확인
      const currentState = this.queryClient.get<T>(this.cacheKey);

      // 아직 isFetching이 설정되지 않은 경우에만 설정
      if (currentState && !currentState.isFetching) {
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

      // fetch 완료 후 결과 업데이트 및 리스너 알림
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
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

      // 에러 후에도 결과 업데이트 및 리스너 알림
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
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
   * Tracked Properties가 적용된 현재 결과 반환
   * TrackedResult 인스턴스를 재사용하여 속성 추적을 유지
   */
  getCurrentResult(): QueryObserverResult<T, E> {
    // TrackedResult가 없으면 새로 생성
    if (!this.trackedResult) {
      this.trackedResult = new TrackedResult(this.currentResult);
    } else if (this.trackedResult.getResult() !== this.currentResult) {
      // 결과가 변경된 경우 업데이트 (캐시 무효화)
      this.trackedResult.updateResult(this.currentResult);
    }

    return this.trackedResult.createProxy();
  }

  /**
   * 수동 refetch
   */
  refetch(): void {
    this.fetchData();
  }

  /**
   * 옵션 업데이트 최적화
   */
  setOptions(options: QueryObserverOptions<T>): void {
    const prevKey = this.cacheKey;
    const prevHash = this.optionsHash;
    const newHash = this.createOptionsHash(options);

    // 해시가 동일한 경우 함수만 업데이트
    if (this.isOptionsUnchanged(prevHash, newHash)) {
      this.updateOptionsOnly(options);
      return;
    }

    const prevOptions = this.options;
    this.updateOptionsAndKey(options, newHash);

    // 키가 변경된 경우
    if (this.isKeyChanged(prevKey)) {
      this.handleKeyChange(prevOptions);
    } else {
      this.handleOptionsChange();
    }
  }

  private isOptionsUnchanged(prevHash: string, newHash: string): boolean {
    return prevHash === newHash;
  }

  private updateOptionsOnly(options: QueryObserverOptions<T>): void {
    this.options = options;
    const hasChanged = this.updateResult();
    if (hasChanged) {
      this.scheduleNotifyListeners();
    }
  }

  private updateOptionsAndKey(
    options: QueryObserverOptions<T>,
    newHash: string
  ): void {
    this.options = options;
    this.cacheKey = serializeQueryKey(options.key);
    this.optionsHash = newHash;
  }

  private isKeyChanged(prevKey: string): boolean {
    return prevKey !== this.cacheKey;
  }

  private handleKeyChange(prevOptions: QueryObserverOptions<T>): void {
    // 이전 구독 해제
    this.unsubscribeFromPreviousKey(prevOptions);

    // 상태 초기화
    this.resetObserverState();

    // 새 키로 구독
    this.subscribeToCache();

    // 캐시 상태에 따른 처리
    if (this.queryClient.has(this.cacheKey)) {
      this.handleCachedDataAvailable();
    } else {
      this.handleNoCachedData();
    }
  }

  private handleOptionsChange(): void {
    // 키는 같지만 다른 옵션이 변경된 경우
    const hasChanged = this.updateResult();
    this.executeFetch();

    if (hasChanged) {
      this.scheduleNotifyListeners();
    }
  }

  private unsubscribeFromPreviousKey(
    prevOptions: QueryObserverOptions<T>
  ): void {
    this.queryClient.unsubscribe(prevOptions.key, prevOptions.gcTime || 300000);
  }

  private resetObserverState(): void {
    this.placeholderState = null;
    this.trackedResult = null;
  }

  private handleCachedDataAvailable(): void {
    // 캐시된 데이터가 있는 경우: 즉시 결과 업데이트, 백그라운드 fetch
    this.currentResult = this.computeResult();
    this.lastResultReference = this.currentResult;

    // TanStack Query 방식: 백그라운드 fetch가 필요한 경우 캐시 상태 미리 업데이트
    const cached = this.queryClient.get<T>(this.cacheKey);
    const isStale = cached ? this.computeStaleTime(cached.updatedAt) : true;
    const shouldFetch = isStale && this.options.enabled !== false;

    if (shouldFetch && cached) {
      // 백그라운드 fetch 시작을 위해 isFetching 상태 미리 설정
      this.queryClient.set(this.cacheKey, {
        ...cached,
        isFetching: true,
      });

      // 결과 재계산하여 isFetching: true 반영
      this.currentResult = this.computeResult();
      this.lastResultReference = this.currentResult;
    }

    // 백그라운드에서 fetch 수행
    this.executeFetch();

    // 단일 렌더링을 위해 한 번만 알림
    this.scheduleNotifyListeners();
  }

  private handleNoCachedData(): void {
    // 캐시가 없는 경우: placeholderData 사용 가능
    const hasChanged = this.updateResult();
    this.executeFetch();

    if (hasChanged) {
      this.scheduleNotifyListeners();
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
