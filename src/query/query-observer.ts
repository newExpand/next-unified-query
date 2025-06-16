import type { QueryClient } from "./query-client";
import type { QueryState } from "./query-cache";
import { serializeQueryKey } from "./query-cache";
import { isEmpty } from "es-toolkit/compat";
import { TrackedResult } from "./tracked-result";
import type {
  QueryObserverOptions,
  QueryObserverResult,
} from "./query-observer-types";
import { replaceEqualDeep } from "./structural-sharing";
import { PlaceholderManager } from "./placeholder-manager";
import { ResultComputer } from "./result-computer";
import { FetchManager } from "./fetch-manager";
import { OptionsManager, type OptionsChangeCallbacks } from "./options-manager";

// Re-export types for backwards compatibility
export type {
  QueryObserverOptions,
  QueryObserverResult,
} from "./query-observer-types";
export { ResultComputer } from "./result-computer";
export { FetchManager } from "./fetch-manager";
export { OptionsManager, type OptionsChangeCallbacks } from "./options-manager";

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

  // TanStack Query v5: 결과 캐싱으로 불필요한 렌더링 방지
  private lastResultReference: QueryObserverResult<T, E> | null = null;

  // TanStack Query v5: Tracked Properties
  private trackedResult: TrackedResult<T, E> | null = null;

  // PlaceholderData 관리자
  private placeholderManager: PlaceholderManager<T>;

  // 결과 계산기
  private resultComputer: ResultComputer<T, E>;

  // Fetch 관리자
  private fetchManager: FetchManager<T>;

  // 옵션 관리자
  private optionsManager: OptionsManager<T, E>;

  constructor(queryClient: QueryClient, options: QueryObserverOptions<T>) {
    this.queryClient = queryClient;
    this.options = options;
    this.cacheKey = serializeQueryKey(options.key);
    this.placeholderManager = new PlaceholderManager<T>(queryClient);
    this.resultComputer = new ResultComputer(
      queryClient,
      this.placeholderManager
    );
    this.fetchManager = new FetchManager(queryClient, this.placeholderManager);
    this.optionsManager = new OptionsManager(
      queryClient,
      this.placeholderManager
    );
    this.optionsHash = this.optionsManager.createOptionsHash(options);

    // 초기 결과 계산 (placeholderData 고려)
    this.currentResult = this.computeResult();

    // 캐시 변경 구독
    this.subscribeToCache();

    // 초기 fetch 실행
    this.executeFetch();
  }

  private subscribeToCache(): void {
    this.queryClient.subscribeListener(this.options.key, () => {
      if (!this.isDestroyed) {
        const hasChanged = this.updateResult();
        if (hasChanged) {
          this.scheduleNotifyListeners();
        }

        // invalidateQueries로 인한 무효화 감지 및 자동 refetch
        this.handlePotentialInvalidation();
      }
    });

    this.queryClient.subscribe(this.options.key);
  }

  /**
   * invalidateQueries로 인한 무효화 감지 및 처리
   * updatedAt이 0이면 invalidateQueries로 인한 무효화로 간주
   */
  private handlePotentialInvalidation(): void {
    const { enabled = true } = this.options;

    if (!enabled) return;

    const cached = this.queryClient.get<T>(this.cacheKey);
    if (cached && cached.updatedAt === 0) {
      // invalidateQueries로 인한 무효화 감지
      // 현재 fetching 중이 아니고 로딩 중이 아닌 경우에만 refetch
      if (!cached.isFetching && !cached.isLoading) {
        this.fetchData();
      }
    }
  }

  /**
   * 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  private computeResult(): QueryObserverResult<T, E> {
    return this.resultComputer.computeResult(this.cacheKey, this.options, () =>
      this.refetch()
    );
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
    await this.fetchManager.executeFetch(this.cacheKey, this.options);
  }

  private async fetchData(): Promise<void> {
    await this.fetchManager.fetchData(this.cacheKey, this.options, () => {
      // fetch 완료 후 결과 업데이트 및 리스너 알림
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
    });
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
    this.fetchManager.refetch(this.cacheKey, this.options, () => {
      // refetch 완료 후 결과 업데이트 및 리스너 알림
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
    });
  }

  /**
   * 옵션 업데이트 최적화
   */
  setOptions(options: QueryObserverOptions<T>): void {
    const prevKey = this.cacheKey;
    const prevHash = this.optionsHash;
    const newHash = this.optionsManager.createOptionsHash(options);

    // 해시가 동일한 경우 함수만 업데이트
    if (this.optionsManager.isOptionsUnchanged(prevHash, newHash)) {
      this.options = options;
      this.optionsManager.updateOptionsOnly(options, this.createCallbacks());
      return;
    }

    const prevOptions = this.options;
    const { cacheKey, optionsHash } = this.optionsManager.updateOptionsAndKey(
      options,
      newHash
    );
    this.options = options;
    this.cacheKey = cacheKey;
    this.optionsHash = optionsHash;

    // 키가 변경된 경우
    if (this.optionsManager.isKeyChanged(prevKey, this.cacheKey)) {
      this.trackedResult = null;
      this.optionsManager.handleKeyChange(
        prevOptions,
        this.cacheKey,
        this.createCallbacks()
      );
    } else {
      this.optionsManager.handleOptionsChange(this.createCallbacks());
    }
  }

  private createCallbacks(): OptionsChangeCallbacks<T, E> {
    return {
      updateResult: () => this.updateResult(),
      scheduleNotifyListeners: () => this.scheduleNotifyListeners(),
      executeFetch: () => this.executeFetch(),
      subscribeToCache: () => this.subscribeToCache(),
      computeResult: () => this.computeResult(),
      handleCachedDataAvailable: () => this.handleCachedDataAvailable(),
      handleNoCachedData: () => this.handleNoCachedData(),
    };
  }

  private handleCachedDataAvailable(): void {
    // 캐시된 데이터가 있는 경우: 즉시 결과 업데이트, 백그라운드 fetch
    this.currentResult = this.computeResult();
    this.lastResultReference = this.currentResult;

    // TanStack Query 방식: 백그라운드 fetch가 필요한 경우 캐시 상태 미리 업데이트
    const cached = this.queryClient.get<T>(this.cacheKey);
    const isStale = cached
      ? Date.now() - cached.updatedAt >= (this.options.staleTime || 0)
      : true;
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
    this.placeholderManager.deactivatePlaceholder();
    this.lastResultReference = null;
    this.trackedResult = null;
  }
}
