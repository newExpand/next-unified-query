import { useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import type { ZodType } from "zod/v4";
import type { FetchConfig } from "../../types";
import { isObject, has } from "es-toolkit/compat";
import { isFunction } from "es-toolkit/predicate";
import { useQueryClient } from "../client/query-client-provider";
import type { QueryConfig, ExtractParams } from "../factories/query-factory";
import {
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from "../observer";

export interface UseQueryOptions<T = any> {
  cacheKey: readonly unknown[];
  url: string;
  params?: Record<string, any>;
  schema?: ZodType;
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
  /**
   * placeholderData: fetch 전 임시 데이터 또는 이전 데이터 유지
   * 값 또는 함수(prevData, prevQuery) 모두 지원
   * ReactNode(JSX)도 허용
   */
  placeholderData?:
    | T
    | React.ReactNode
    | ((
        prevData: T | React.ReactNode | undefined,
        prevQuery?: any
      ) => T | React.ReactNode);
  /**
   * gcTime: 쿼리 데이터가 사용되지 않을 때(구독자가 0이 될 때) 가비지 컬렉션까지의 시간(ms)
   * 이는 생명주기 관리 전략으로, maxQueries(메모리 보호)와는 별개로 동작합니다.
   * @default 300000 (5분)
   */
  gcTime?: number;
}

type UseQueryFactoryOptions<P, T> = Omit<
  UseQueryOptions<T>,
  "cacheKey" | "url" | "params" | "schema" | "fetchConfig"
> &
  (P extends void
    ? { params?: P }
    : keyof P extends never
    ? { params?: P }
    : { params: P });

// 1. Factory-based: useQuery<T>(query, options)
export function useQuery<T = unknown, E = unknown>(
  query: QueryConfig<any, any>,
  options: UseQueryFactoryOptions<ExtractParams<typeof query>, T>
): QueryObserverResult<T, E>;

// 2. Options-based: useQuery<T>(options)
export function useQuery<T = unknown, E = unknown>(
  options: UseQueryOptions<T>
): QueryObserverResult<T, E>;

// Implementation
export function useQuery(arg1: any, arg2?: any): any {
  // QueryConfig 기반
  if (
    isObject(arg1) &&
    has(arg1, "cacheKey") &&
    isFunction((arg1 as QueryConfig<any, any>).cacheKey) &&
    isFunction((arg1 as QueryConfig<any, any>).url)
  ) {
    const query = arg1 as QueryConfig<any, any>;
    const options = arg2 ?? {};
    const params = options.params;
    const cacheKey = query.cacheKey?.(params);
    const url = query.url?.(params);
    const schema = query.schema;
    const placeholderData = options.placeholderData ?? query.placeholderData;
    const fetchConfig = options.fetchConfig ?? query.fetchConfig;
    const select = options.select ?? query.select;
    const enabled = has(options, "enabled")
      ? options.enabled // 명시적으로 전달된 경우 해당 값 사용
      : isFunction(query.enabled)
      ? query.enabled(params) // Factory의 enabled 함수 호출
      : query.enabled; // Factory의 enabled 불린 값 사용

    return _useQueryObserver({
      ...query,
      ...options,
      enabled,
      cacheKey,
      url,
      params,
      schema,
      placeholderData,
      fetchConfig,
      select,
    });
  }
  // 명시적 타입 지정 방식
  return _useQueryObserver({
    ...arg1,
  });
}

function _useQueryObserver<T = unknown, E = unknown>(
  options: UseQueryOptions<T>
): QueryObserverResult<T, E> {
  const queryClient = useQueryClient();
  const observerRef = useRef<QueryObserver<T, E> | undefined>(undefined);
  const optionsHashRef = useRef<string>("");

  // 기본 결과 객체를 캐싱하여 안정적인 참조 제공
  const defaultResultRef = useRef<QueryObserverResult<T, E>>({
    data: undefined,
    error: undefined,
    isLoading: true,
    isFetching: true,
    isError: false,
    isSuccess: false,
    isStale: true,
    isPlaceholderData: false,
    refetch: () => {},
  });

  // 옵션을 해시로 변환 (함수 제외)
  const createOptionsHash = (opts: UseQueryOptions<T>): string => {
    const hashableOptions = {
      cacheKey: opts.cacheKey,
      url: opts.url,
      params: opts.params,
      enabled: opts.enabled,
      staleTime: opts.staleTime,
      gcTime: opts.gcTime,
      // 함수들은 해시에서 제외 (항상 새로 생성되므로)
    };
    return JSON.stringify(hashableOptions);
  };

  const currentHash = createOptionsHash(options);
  const shouldUpdate =
    !observerRef.current || optionsHashRef.current !== currentHash;

  // Observer 생성 또는 옵션 업데이트 (렌더링 중 직접 처리)
  if (!observerRef.current) {
    observerRef.current = new QueryObserver<T, E>(queryClient, {
      ...options,
      key: options.cacheKey,
    } as QueryObserverOptions<T>);
    optionsHashRef.current = currentHash;
  } else if (shouldUpdate) {
    // 렌더링 중에 직접 업데이트
    observerRef.current.setOptions({
      ...options,
      key: options.cacheKey,
    } as QueryObserverOptions<T>);
    optionsHashRef.current = currentHash;
  }

  // 안정적인 subscribe 함수
  const subscribe = useCallback((callback: () => void) => {
    return observerRef.current!.subscribe(callback);
  }, []);

  // 최적화된 getSnapshot 함수
  const getSnapshot = useCallback(() => {
    if (!observerRef.current) {
      // Observer가 없는 경우 캐시된 기본 결과 반환
      return defaultResultRef.current;
    }

    // QueryObserver에서 이미 Tracked Properties와 Structural Sharing이 처리됨
    // 추가적인 비교 없이 결과를 그대로 반환
    return observerRef.current.getCurrentResult();
  }, []);

  // useSyncExternalStore로 Observer 구독
  const result = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot // getServerSnapshot도 동일하게
  );

  // 컴포넌트 언마운트 시 Observer 정리
  useEffect(() => {
    return () => {
      observerRef.current?.destroy();
    };
  }, []);

  return result;
}
