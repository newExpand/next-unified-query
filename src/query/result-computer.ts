import type { QueryClient } from "./query-client";
import type { QueryState } from "./query-cache";
import type {
  QueryObserverOptions,
  QueryObserverResult,
} from "./query-observer-types";
import { PlaceholderManager } from "./placeholder-manager";
import { isNil } from "es-toolkit/compat";

/**
 * QueryObserver 결과 계산기 클래스
 *
 * @description
 * QueryObserver의 결과 계산 로직을 담당합니다.
 * 캐시 상태, PlaceholderData, 초기 로딩 상태에 따라
 * 적절한 QueryObserverResult를 생성합니다.
 */
export class ResultComputer<T = unknown, E = unknown> {
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
   * 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  computeResult(
    cacheKey: string,
    options: QueryObserverOptions<T>,
    refetchFn: () => void
  ): QueryObserverResult<T, E> {
    const cached = this.queryClient.get<T>(cacheKey);

    // 1. 캐시된 데이터가 있는 경우
    if (this.hasCachedData(cached)) {
      return this.createCachedResult(cached!, options, refetchFn);
    }

    // 2. 캐시가 없는 경우: placeholderData 확인
    const placeholderData =
      this.placeholderManager.computePlaceholderData(options);
    if (this.placeholderManager.hasValidPlaceholderData(placeholderData)) {
      return this.createPlaceholderResult(placeholderData!, options, refetchFn);
    }

    // 3. 캐시도 placeholderData도 없는 경우: 초기 loading 상태
    return this.createInitialLoadingResult(refetchFn);
  }

  /**
   * 캐시된 데이터가 있는지 확인
   */
  private hasCachedData(cached: QueryState<T> | undefined): boolean {
    return !!cached;
  }

  /**
   * 캐시된 결과 생성
   */
  private createCachedResult(
    cached: QueryState<T>,
    options: QueryObserverOptions<T>,
    refetchFn: () => void
  ): QueryObserverResult<T, E> {
    const finalData = this.applySelect(cached.data, options);
    const isStale = this.computeStaleTime(cached.updatedAt, options);

    return {
      data: finalData,
      error: cached.error as E,
      isLoading: cached.isLoading,
      isFetching: cached.isFetching, // 캐시된 상태의 isFetching 값 사용
      isError: !!cached.error,
      isSuccess: this.isSuccessState(cached),
      isStale,
      isPlaceholderData: false, // 캐시된 데이터는 항상 false
      refetch: refetchFn,
    };
  }

  /**
   * PlaceholderData 결과 생성
   */
  private createPlaceholderResult(
    placeholderData: any,
    options: QueryObserverOptions<T>,
    refetchFn: () => void
  ): QueryObserverResult<T, E> {
    // placeholderData가 있는 경우: success 상태로 시작
    this.placeholderManager.setPlaceholderState({
      data: placeholderData,
      isActive: true,
    });

    const finalData = this.applySelect(placeholderData as T, options);

    return {
      data: finalData,
      error: undefined,
      isLoading: false, // placeholderData는 success 상태
      isFetching: true, // 백그라운드에서 fetch 중
      isError: false,
      isSuccess: true,
      isStale: true,
      isPlaceholderData: true,
      refetch: refetchFn,
    };
  }

  /**
   * 초기 로딩 결과 생성
   */
  private createInitialLoadingResult(
    refetchFn: () => void
  ): QueryObserverResult<T, E> {
    this.placeholderManager.deactivatePlaceholder();

    return {
      data: undefined,
      error: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      isStale: true,
      isPlaceholderData: false,
      refetch: refetchFn,
    };
  }

  /**
   * 성공 상태인지 확인
   */
  private isSuccessState(cached: QueryState<T>): boolean {
    return !cached.isLoading && !cached.error && !isNil(cached.data);
  }

  /**
   * select 함수 적용
   */
  private applySelect(
    data: T | React.ReactNode | undefined,
    options: QueryObserverOptions<T>
  ): T | undefined {
    if (isNil(data) || !options.select) return data as T;

    try {
      return options.select(data as T);
    } catch {
      return data as T;
    }
  }

  /**
   * Stale 시간 계산
   */
  private computeStaleTime(
    updatedAt: number,
    options: QueryObserverOptions<T>
  ): boolean {
    return updatedAt
      ? Date.now() - updatedAt >= (options.staleTime || 0)
      : true;
  }
}
