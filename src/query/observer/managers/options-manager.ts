import type { QueryClient } from "../../client/query-client";
import type { QueryObserverOptions } from "../types";
import { serializeQueryKey } from "../../cache/query-cache";
import { PlaceholderManager } from "./placeholder-manager";
import { pick } from "es-toolkit/compat";

/**
 * 옵션 변경 처리 콜백 타입
 */
export interface OptionsChangeCallbacks<T, E> {
  updateResult: () => boolean;
  scheduleNotifyListeners: () => void;
  executeFetch: () => Promise<void>;
  subscribeToCache: () => void;
  computeResult: () => any;
  handleCachedDataAvailable: () => void;
  handleNoCachedData: () => void;
}

/**
 * QueryObserver 옵션 관리자 클래스
 *
 * @description
 * QueryObserver의 옵션 관리 로직을 담당합니다.
 * 옵션 해시 생성, 변경 감지, 키 변경 처리,
 * 상태 초기화 등을 관리합니다.
 */
export class OptionsManager<T = unknown, E = unknown> {
  private queryClient: QueryClient;
  private placeholderManager: PlaceholderManager<T>;

  constructor(
    queryClient: QueryClient,
    placeholderManager: PlaceholderManager<T>
  ) {
    this.queryClient = queryClient;
    this.placeholderManager = placeholderManager;
  }

  /**
   * 옵션 해시 생성
   * 해시에 포함할 속성들만 선택하여 JSON 직렬화
   */
  createOptionsHash<T>(options: QueryObserverOptions<T>): string {
    // pick을 사용하여 해시에 포함할 속성들만 선택
    const hashableOptions = pick(options, [
      "key",
      "url",
      "params",
      "enabled",
      "staleTime",
      "gcTime",
      // queryFn은 함수이므로 해시에서 제외 (함수 참조는 항상 다르므로)
    ]);
    return JSON.stringify(hashableOptions);
  }

  /**
   * 옵션 변경 여부 확인
   */
  isOptionsUnchanged(prevHash: string, newHash: string): boolean {
    return prevHash === newHash;
  }

  /**
   * 키 변경 여부 확인
   */
  isKeyChanged(prevKey: string, newKey: string): boolean {
    return prevKey !== newKey;
  }

  /**
   * 옵션만 업데이트 (키는 동일)
   */
  updateOptionsOnly<T>(
    options: QueryObserverOptions<T>,
    callbacks: OptionsChangeCallbacks<T, E>
  ): void {
    const hasChanged = callbacks.updateResult();
    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }

  /**
   * 옵션과 키 업데이트
   */
  updateOptionsAndKey<T>(
    options: QueryObserverOptions<T>,
    newHash: string
  ): { cacheKey: string; optionsHash: string } {
    const cacheKey = serializeQueryKey(options.key);
    return { cacheKey, optionsHash: newHash };
  }

  /**
   * 키 변경 처리
   */
  handleKeyChange<T>(
    prevOptions: QueryObserverOptions<T>,
    newCacheKey: string,
    callbacks: OptionsChangeCallbacks<T, E>
  ): void {
    // 이전 구독 해제
    this.unsubscribeFromPreviousKey(prevOptions);

    // 상태 초기화 (PlaceholderData만 처리)
    this.placeholderManager.deactivatePlaceholder();

    // 새 키로 구독
    callbacks.subscribeToCache();

    // 캐시 상태에 따른 처리
    if (this.queryClient.has(newCacheKey)) {
      callbacks.handleCachedDataAvailable();
    } else {
      callbacks.handleNoCachedData();
    }
  }

  /**
   * 옵션 변경 처리 (키는 동일)
   */
  handleOptionsChange<T>(callbacks: OptionsChangeCallbacks<T, E>): void {
    // 키는 같지만 다른 옵션이 변경된 경우
    const hasChanged = callbacks.updateResult();
    callbacks.executeFetch();

    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }

  /**
   * 이전 키 구독 해제
   */
  private unsubscribeFromPreviousKey<T>(
    prevOptions: QueryObserverOptions<T>
  ): void {
    this.queryClient.unsubscribe(prevOptions.key, prevOptions.gcTime || 300000);
  }

  /**
   * Observer 상태 초기화 (PlaceholderData만 처리)
   */
  resetObserverState(): void {
    this.placeholderManager.deactivatePlaceholder();
  }

  /**
   * 캐시된 데이터 처리 로직
   */
  handleCachedDataAvailable<T>(
    cacheKey: string,
    options: QueryObserverOptions<T>,
    callbacks: {
      computeResult: () => any;
      executeFetch: () => Promise<void>;
      scheduleNotifyListeners: () => void;
    }
  ): { currentResult: any; lastResultReference: any } {
    // 캐시된 데이터가 있는 경우: 즉시 결과 업데이트, 백그라운드 fetch
    const currentResult = callbacks.computeResult();
    const lastResultReference = currentResult;

    // 백그라운드 fetch가 필요한 경우 캐시 상태 미리 업데이트
    const cached = this.queryClient.get<T>(cacheKey);
    const isStale = cached
      ? Date.now() - cached.updatedAt >= (options.staleTime || 0)
      : true;
    const shouldFetch = isStale && options.enabled !== false;

    if (shouldFetch && cached) {
      // 백그라운드 fetch 시작을 위해 isFetching 상태 미리 설정
      this.queryClient.set(cacheKey, {
        ...cached,
        isFetching: true,
      });

      // 결과 재계산하여 isFetching: true 반영
      const updatedResult = callbacks.computeResult();
      callbacks.executeFetch();
      callbacks.scheduleNotifyListeners();

      return {
        currentResult: updatedResult,
        lastResultReference: updatedResult,
      };
    }

    // 백그라운드에서 fetch 수행
    callbacks.executeFetch();

    // 단일 렌더링을 위해 한 번만 알림
    callbacks.scheduleNotifyListeners();

    return { currentResult, lastResultReference };
  }

  /**
   * 캐시된 데이터가 없는 경우 처리
   */
  handleNoCachedData<T>(callbacks: OptionsChangeCallbacks<T, E>): void {
    // 캐시가 없는 경우: placeholderData 사용 가능
    const hasChanged = callbacks.updateResult();
    callbacks.executeFetch();

    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }
}
