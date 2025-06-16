import type { QueryClient } from "./query-client";
import type { QueryObserverOptions } from "./query-observer-types";
import type { FetchConfig } from "../types/index";
import { PlaceholderManager } from "./placeholder-manager";
import { isNotNil } from "es-toolkit/predicate";
import { merge } from "es-toolkit/compat";

/**
 * QueryObserver fetch 관리자 클래스
 *
 * @description
 * QueryObserver의 데이터 페칭 로직을 담당합니다.
 * fetch 실행 조건 확인, 실제 데이터 페칭, 상태 업데이트,
 * 에러 처리를 관리합니다.
 */
export class FetchManager<T = unknown> {
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
   * Fetch 실행
   * enabled 옵션과 stale 상태를 확인하여 필요한 경우에만 페칭을 수행합니다.
   */
  async executeFetch<T>(
    cacheKey: string,
    options: QueryObserverOptions<T>,
    onComplete?: () => void
  ): Promise<void> {
    const { enabled = true, staleTime = 0 } = options;

    if (!enabled) return;

    const cached = this.queryClient.get<T>(cacheKey);
    const isStale = cached ? Date.now() - cached.updatedAt >= staleTime : true;

    if (!cached || isStale) {
      await this.fetchData(cacheKey, options, onComplete);
    }
  }

  /**
   * 데이터 페칭
   * 실제 HTTP 요청을 수행하고 결과를 캐시에 저장합니다.
   */
  async fetchData<T>(
    cacheKey: string,
    options: QueryObserverOptions<T>,
    onComplete?: () => void
  ): Promise<void> {
    try {
      // fetch 설정이 이미 다른 곳에서 처리되었는지 확인
      const currentState = this.queryClient.get<T>(cacheKey);

      // 아직 isFetching이 설정되지 않은 경우에만 설정
      if (currentState && !currentState.isFetching) {
        this.queryClient.set(cacheKey, {
          ...currentState,
          isFetching: true,
        });
      }

      // fetch 결과
      const result = await this.performHttpRequest(options);

      // 성공 상태 저장 - placeholderData 비활성화
      this.placeholderManager.deactivatePlaceholder();

      this.queryClient.set(cacheKey, {
        data: result,
        error: undefined,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });

      // 완료 콜백 실행
      onComplete?.();
    } catch (error: any) {
      // 에러 상태 저장 - placeholderData 비활성화
      this.placeholderManager.deactivatePlaceholder();

      this.queryClient.set(cacheKey, {
        data: undefined as T | undefined,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });

      // 에러 시에도 완료 콜백 실행
      onComplete?.();
    }
  }

  /**
   * HTTP 요청 수행
   * 실제 네트워크 요청을 처리하고 스키마 검증을 수행합니다.
   */
  private async performHttpRequest<T>(
    options: QueryObserverOptions<T>
  ): Promise<T> {
    // fetch 설정 구성
    const fetcher = this.queryClient.getFetcher();
    let config: FetchConfig = merge({}, options.fetchConfig ?? {});

    if (isNotNil(options.params)) {
      config = merge(config, { params: options.params });
    }
    if (isNotNil(options.schema)) {
      config = merge(config, { schema: options.schema });
    }

    // 데이터 fetch
    const response = await fetcher.get(options.url, config as FetchConfig);
    let result = response.data as T;

    // 스키마 검증
    if (options.schema) {
      result = options.schema.parse(result) as T;
    }

    return result;
  }

  /**
   * 수동 refetch
   * 캐시 키와 옵션을 받아 즉시 데이터를 다시 페칭합니다.
   */
  async refetch<T>(
    cacheKey: string,
    options: QueryObserverOptions<T>,
    onComplete?: () => void
  ): Promise<void> {
    await this.fetchData(cacheKey, options, onComplete);
  }

  /**
   * 페칭 상태 확인
   * 현재 페칭 중인지 확인합니다.
   */
  isFetching<T>(cacheKey: string): boolean {
    const cached = this.queryClient.get<T>(cacheKey);
    return cached?.isFetching ?? false;
  }

  /**
   * Stale 상태 확인
   * 캐시된 데이터가 stale한지 확인합니다.
   */
  isStale<T>(cacheKey: string, staleTime: number = 0): boolean {
    const cached = this.queryClient.get<T>(cacheKey);
    return cached ? Date.now() - cached.updatedAt >= staleTime : true;
  }
}
