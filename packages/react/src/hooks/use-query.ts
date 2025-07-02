import { useEffect, useRef, useSyncExternalStore, useCallback } from "react";
import type { ZodType, FetchConfig, FetchError } from "next-unified-query-core";
import { isObject, has, isFunction } from "es-toolkit/compat";
import { useQueryClient } from "../query-client-provider";
import type {
  QueryConfig,
  ExtractParams,
  ExtractQueryData,
} from "next-unified-query-core";
import { validateQueryConfig } from "next-unified-query-core";
import {
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from "next-unified-query-core";

/**
 * 기본 UseQuery 옵션 (공통 속성)
 */
interface BaseUseQueryOptions<T = any> {
  cacheKey: readonly unknown[];
  params?: Record<string, any>;
  schema?: ZodType;
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
  selectDeps?: any[];
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

/**
 * URL 기반 UseQuery 옵션
 */
interface UrlBasedUseQueryOptions<T = any> extends BaseUseQueryOptions<T> {
  /**
   * API 요청 URL
   */
  url: string;

  /**
   * queryFn이 있으면 안됨 (상호 배제)
   */
  queryFn?: never;
}

/**
 * Custom Function 기반 UseQuery 옵션
 */
interface FunctionBasedUseQueryOptions<T = any> extends BaseUseQueryOptions<T> {
  /**
   * Custom query function for complex requests
   * Options 방식에서는 QueryFetcher만 전달 (GET/HEAD 메서드만 허용)
   * 인자: fetcher (QueryFetcher 인스턴스)
   */
  queryFn: (
    fetcher: import("next-unified-query-core").QueryFetcher
  ) => Promise<T>;

  /**
   * url이 있으면 안됨 (상호 배제)
   */
  url?: never;
}

/**
 * UseQuery 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
export type UseQueryOptions<T = any> =
  | UrlBasedUseQueryOptions<T>
  | FunctionBasedUseQueryOptions<T>;

/**
 * Schema에서 타입을 추출하는 도우미 타입
 */
type InferSchemaType<T> = T extends { schema: infer S }
  ? S extends ZodType
    ? import("next-unified-query-core").z.infer<S>
    : any
  : any;

type UseQueryFactoryOptions<P, T> = Omit<
  UseQueryOptions<T>,
  "cacheKey" | "url" | "queryFn" | "params" | "schema" | "fetchConfig"
> &
  (P extends void
    ? { params?: P }
    : keyof P extends never
    ? { params?: P }
    : { params: P });

// 1. Factory-based with explicit type (HIGHEST priority): useQuery<T>(query, options)
export function useQuery<T, E = FetchError>(
  query: QueryConfig<any, any>,
  options: UseQueryFactoryOptions<ExtractParams<typeof query>, T>
): QueryObserverResult<T, E>;

// 2. Factory-based with schema inference (HIGH priority): useQuery(query, options)
export function useQuery<Q extends QueryConfig<any, any>, E = FetchError>(
  query: Q,
  options: UseQueryFactoryOptions<ExtractParams<Q>, ExtractQueryData<Q>>
): QueryObserverResult<ExtractQueryData<Q>, E>;

// 3. Options-based with schema inference (MEDIUM-HIGH priority): useQuery(options) - schema 있는 경우
export function useQuery<
  O extends UseQueryOptions<any> & { schema: ZodType },
  E = FetchError
>(options: O): QueryObserverResult<InferSchemaType<O>, E>;

// 4. Options-based with explicit type (MEDIUM priority): useQuery<T>(options) - 모든 옵션 허용
export function useQuery<T, E = FetchError>(
  options: UseQueryOptions<T>
): QueryObserverResult<T, E>;

// Implementation
export function useQuery(arg1: any, arg2?: any): any {
  // QueryConfig 기반
  if (
    isObject(arg1) &&
    has(arg1, "cacheKey") &&
    isFunction((arg1 as QueryConfig<any, any>).cacheKey)
  ) {
    const query = arg1 as QueryConfig<any, any>;

    // QueryConfig 런타임 검증
    validateQueryConfig(query);

    const options = arg2 ?? {};
    const params = options.params;
    const cacheKey = query.cacheKey?.(params);
    const url = query.url?.(params);
    const queryFn = query.queryFn;
    const schema = query.schema;
    const placeholderData = options.placeholderData ?? query.placeholderData;
    const fetchConfig = options.fetchConfig ?? query.fetchConfig;
    const select = options.select ?? query.select;
    const selectDeps = options.selectDeps ?? query.selectDeps;
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
      queryFn,
      params,
      schema,
      placeholderData,
      fetchConfig,
      select,
      selectDeps,
    });
  }
  // 명시적 타입 지정 방식
  return _useQueryObserver({
    ...arg1,
  });
}

function _useQueryObserver<T = unknown, E = FetchError>(
  options: UseQueryOptions<T>
): QueryObserverResult<T, E> {
  // UseQueryOptions 런타임 검증 (factory의 validateQueryConfig 사용)
  validateQueryConfig(options);

  const queryClient = useQueryClient();
  const observerRef = useRef<QueryObserver<T, E> | undefined>(undefined);

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

  // Observer 생성 또는 옵션 업데이트 (렌더링 중 직접 처리)
  if (!observerRef.current) {
    observerRef.current = new QueryObserver<T, E>(queryClient, {
      ...options,
      key: options.cacheKey,
    } as QueryObserverOptions<T>);
  } else {
    // setOptions가 내부적으로 변경 여부를 체크하므로 항상 호출
    observerRef.current.setOptions({
      ...options,
      key: options.cacheKey,
    } as QueryObserverOptions<T>);
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

  // Observer 시작 (컴포넌트 마운트 후)
  useEffect(() => {
    observerRef.current?.start();
  }, []);

  // 컴포넌트 언마운트 시 Observer 정리
  useEffect(() => {
    return () => {
      observerRef.current?.destroy();
    };
  }, []);

  return result;
}
