import type { QueryClient } from "../client/query-client";
import { serializeQueryKey } from "../cache/query-cache";
import { isEmpty } from "es-toolkit/compat";
import { TrackedResult, replaceEqualDeep } from "./utils";
import type { QueryObserverOptions, QueryObserverResult } from "./types";
import {
  PlaceholderManager,
  ResultComputer,
  FetchManager,
  OptionsManager,
  type OptionsChangeCallbacks,
} from "./managers";

/**
 *  Observer 패턴 구현
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

  // 결과 캐싱으로 불필요한 렌더링 방지
  private lastResultReference: QueryObserverResult<T, E> | null = null;

  // Tracked Properties
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

    // 초기 fetch 실행 (캐시 상태 확인 후)
    this.executeInitialFetch();
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

  /**
   * 초기 fetch 실행 - 캐시 상태를 확인하고 필요한 경우에만 fetch
   */
  private async executeInitialFetch(): Promise<void> {
    if (!this.isQueryEnabled()) return;

    const cached = this.queryClient.get<T>(this.cacheKey);

    if (this.isServerSide()) {
      await this.handleServerSideInitialFetch(cached);
      return;
    }

    await this.handleClientSideInitialFetch(cached);
  }

  /**
   * 쿼리가 활성화되어 있는지 확인
   */
  private isQueryEnabled(): boolean {
    return this.options.enabled !== false;
  }

  /**
   * 서버사이드 환경인지 확인
   */
  private isServerSide(): boolean {
    return typeof window === "undefined";
  }

  /**
   * 서버사이드 초기 fetch 처리
   */
  private async handleServerSideInitialFetch(cached: any): Promise<void> {
    if (cached) {
      // 서버에서는 캐시된 데이터가 있으면 그대로 사용 (staleTime 무시)
      return;
    }

    // 서버에서는 캐시가 없어도 fetch하지 않음 (클라이언트에서 처리)
  }

  /**
   * 클라이언트사이드 초기 fetch 처리
   */
  private async handleClientSideInitialFetch(cached: any): Promise<void> {
    if (!cached) {
      await this.executeFetch();
      return;
    }

    if (this.isCacheStale(cached)) {
      await this.executeFetch();
    }
    // fresh한 경우에는 fetch 하지 않음
  }

  /**
   * 캐시가 stale 상태인지 확인
   */
  private isCacheStale(cached: any): boolean {
    const { staleTime = 0 } = this.options;
    return Date.now() - cached.updatedAt >= staleTime;
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
    this.ensureTrackedResultExists();
    return this.trackedResult!.createProxy();
  }

  /**
   * TrackedResult 인스턴스가 존재하고 최신 상태인지 확인
   */
  private ensureTrackedResultExists(): void {
    if (!this.trackedResult) {
      this.createNewTrackedResult();
    } else if (this.isTrackedResultOutdated()) {
      this.updateTrackedResult();
    }
  }

  /**
   * 새로운 TrackedResult 인스턴스 생성
   */
  private createNewTrackedResult(): void {
    this.trackedResult = new TrackedResult(this.currentResult);
  }

  /**
   * TrackedResult가 구식인지 확인
   */
  private isTrackedResultOutdated(): boolean {
    return this.trackedResult!.getResult() !== this.currentResult;
  }

  /**
   * TrackedResult를 최신 결과로 업데이트
   */
  private updateTrackedResult(): void {
    this.trackedResult!.updateResult(this.currentResult);
  }

  /**
   * 수동 refetch
   * force 옵션이 true인 경우 staleTime을 무시하고 강제로 페칭합니다.
   */
  refetch(force: boolean = true): void {
    this.fetchManager.refetch(
      this.cacheKey,
      this.options,
      () => {
        // refetch 완료 후 결과 업데이트 및 리스너 알림
        const hasChanged = this.updateResult();
        if (hasChanged) {
          this.scheduleNotifyListeners();
        }
      },
      force
    );
  }

  /**
   * 옵션 업데이트 최적화
   */
  setOptions(options: QueryObserverOptions<T>): void {
    const prevKey = this.cacheKey;
    const prevHash = this.optionsHash;
    const newHash = this.optionsManager.createOptionsHash(options);

    if (this.isOptionsUnchanged(prevHash, newHash)) {
      this.updateFunctionsOnly(options);
      return;
    }

    const prevOptions = this.options;
    this.updateOptionsAndCacheKey(options, newHash);

    if (this.isKeyChanged(prevKey)) {
      this.handleKeyChange(prevOptions);
    } else {
      this.handleOptionsChange();
    }
  }

  /**
   * 옵션이 변경되지 않았는지 확인
   */
  private isOptionsUnchanged(prevHash: string, newHash: string): boolean {
    return this.optionsManager.isOptionsUnchanged(prevHash, newHash);
  }

  /**
   * 함수들만 업데이트 (옵션 해시가 동일한 경우)
   */
  private updateFunctionsOnly(options: QueryObserverOptions<T>): void {
    this.options = options;
    this.optionsManager.updateOptionsOnly(options, this.createCallbacks());
  }

  /**
   * 옵션과 캐시 키를 업데이트
   */
  private updateOptionsAndCacheKey(
    options: QueryObserverOptions<T>,
    newHash: string
  ): void {
    const { cacheKey, optionsHash } = this.optionsManager.updateOptionsAndKey(
      options,
      newHash
    );
    this.options = options;
    this.cacheKey = cacheKey;
    this.optionsHash = optionsHash;
  }

  /**
   * 캐시 키가 변경되었는지 확인
   */
  private isKeyChanged(prevKey: string): boolean {
    return this.optionsManager.isKeyChanged(prevKey, this.cacheKey);
  }

  /**
   * 키 변경 처리
   */
  private handleKeyChange(prevOptions: QueryObserverOptions<T>): void {
    this.trackedResult = null;
    this.optionsManager.handleKeyChange(
      prevOptions,
      this.cacheKey,
      this.createCallbacks()
    );
  }

  /**
   * 옵션 변경 처리
   */
  private handleOptionsChange(): void {
    this.optionsManager.handleOptionsChange(this.createCallbacks());
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
    // 캐시된 데이터가 있는 경우: 즉시 결과 업데이트, stale인 경우에만 백그라운드 fetch
    this.updateCurrentResult();

    const cached = this.queryClient.get<T>(this.cacheKey);
    if (this.shouldStartBackgroundFetch(cached)) {
      this.startBackgroundFetch(cached);
    }

    // 단일 렌더링을 위해 한 번만 알림
    this.scheduleNotifyListeners();
  }

  /**
   * 현재 결과를 업데이트하고 참조를 저장
   */
  private updateCurrentResult(): void {
    this.currentResult = this.computeResult();
    this.lastResultReference = this.currentResult;
  }

  /**
   * 백그라운드 fetch를 시작해야 하는지 확인
   */
  private shouldStartBackgroundFetch(cached: any): boolean {
    if (!cached || this.options.enabled === false) {
      return false;
    }

    return this.isCacheStale(cached);
  }

  /**
   * 백그라운드 fetch 시작
   */
  private startBackgroundFetch(cached: any): void {
    // 캐시 상태를 fetching으로 업데이트
    this.queryClient.set(this.cacheKey, {
      ...cached,
      isFetching: true,
    });

    // 결과 재계산하여 isFetching: true 반영
    this.updateCurrentResult();

    // 백그라운드에서 fetch 수행
    this.executeFetch();
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
