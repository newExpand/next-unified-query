import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ZodType } from "zod/v4";
import { serializeQueryKey } from "./query-cache.js";
import type { FetchConfig } from "../types/index.js";
import { isObject, has } from "es-toolkit/compat";
import { merge } from "es-toolkit/object";
import { isNotNil, isFunction } from "es-toolkit/predicate";
import type { QueryState } from "./query-cache.js";
import { useQueryClient } from "./query-client-provider";
import type { QueryConfig, ExtractParams } from "./query-factory.js";

export interface UseQueryOptions<T = any> {
  key: readonly unknown[];
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
        prevQuery?: QueryState<T> | undefined
      ) => T | React.ReactNode);
  /**
   * cacheTime: 쿼리 데이터가 사용되지 않을 때(구독자가 0이 될 때) 캐시를 유지할 시간(ms)
   * 기본값: 300000 (5분)
   */
  cacheTime?: number;
}

type UseQueryFactoryOptions<P, T> = Omit<
  UseQueryOptions<T>,
  "key" | "url" | "params" | "schema" | "fetchConfig"
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
): ReturnType<typeof _useQueryOptions<T, E>>;

// 2. Options-based: useQuery<T>(options)
export function useQuery<T = unknown, E = unknown>(
  options: UseQueryOptions<T>
): ReturnType<typeof _useQueryOptions<T, E>>;

// Implementation
export function useQuery(arg1: any, arg2?: any): any {
  // QueryConfig 기반
  if (
    isObject(arg1) &&
    has(arg1, "key") &&
    isFunction((arg1 as QueryConfig<any, any>).key) &&
    isFunction((arg1 as QueryConfig<any, any>).url)
  ) {
    const query = arg1 as QueryConfig<any, any>;
    const options = arg2 ?? {};
    const params = options.params;
    const key = query.key?.(params);
    const url = query.url?.(params);
    const schema = query.schema;
    const placeholderData = query.placeholderData;
    const fetchConfig = query.fetchConfig;
    const select = query.select;
    const enabled =
      options.enabled ??
      (isFunction(query.enabled) ? query.enabled(params) : query.enabled);
    return _useQueryOptions({
      ...query,
      ...options,
      enabled,
      key,
      url,
      params,
      schema,
      placeholderData,
      fetchConfig,
      select,
    });
  }
  // 명시적 타입 지정 방식
  return _useQueryOptions(arg1);
}

function _useQueryOptions<T = unknown, E = unknown>(
  options: UseQueryOptions<T>
) {
  const {
    key,
    url,
    params,
    schema,
    fetchConfig,
    enabled = true,
    staleTime = 0,
    select,
    placeholderData,
    cacheTime = 300000, // 기본값 5분
  } = options;

  const queryClient = useQueryClient();
  const fetcher = queryClient.getFetcher();
  const cacheKey = serializeQueryKey(key);

  const prevCacheKeyRef = useRef<string>(cacheKey);
  const isKeyChanged =
    prevCacheKeyRef.current !== undefined &&
    prevCacheKeyRef.current !== cacheKey;

  if (isKeyChanged && placeholderData && !queryClient.has(cacheKey)) {
    const prevQuery = queryClient.get<T>(prevCacheKeyRef.current!);
    const newPlaceholderData = isFunction(placeholderData)
      ? placeholderData(prevQuery?.data, prevQuery)
      : placeholderData;

    if (newPlaceholderData !== undefined) {
      queryClient.set(cacheKey, {
        data: newPlaceholderData,
        error: undefined,
        isLoading: true,
        isFetching: true,
        updatedAt: 0,
        isPlaceholderData: true,
      });
    }
  }

  // subscribe/unsubscribe
  const subscribe = (callback: () => void) => {
    return queryClient.subscribeListener(key, callback);
  };

  // SSR 환경에서 사용할 초기 상태 반환 (항상 동일 객체)
  const INITIAL_SERVER_SNAPSHOT = {
    data: undefined,
    error: undefined,
    isLoading: true,
    isFetching: true,
    updatedAt: 0,
    isPlaceholderData: false,
  };

  // getSnapshot: 오직 캐시만 읽어서 반환, 상태 변경 금지
  const getSnapshot = () => {
    const cached = queryClient.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    return INITIAL_SERVER_SNAPSHOT;
  };

  const getServerSnapshot = getSnapshot;

  // React 18+ 공식 외부 상태 동기화
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 쿼리키 변경 감지 및 placeholderData 동기 set (상태 변경은 여기서만)
  useEffect(() => {
    prevCacheKeyRef.current = cacheKey;
  });

  useEffect(() => {
    const cached = queryClient.get<T>(cacheKey);

    if (cached && !cached.isPlaceholderData) {
      return;
    }

    if (enabled) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, queryClient, enabled]);

  // 구독 관리
  useEffect(() => {
    queryClient.subscribe(key);
    return () => {
      queryClient.unsubscribe(key, cacheTime);
    };
  }, [cacheKey, cacheTime, queryClient]);

  // fetchData: fetch 완료 시 false로만 전이
  const fetchData = async () => {
    try {
      let config: FetchConfig = merge({}, fetchConfig ?? {});
      if (isNotNil(params)) config = merge(config, { params });
      if (isNotNil(schema)) config = merge(config, { schema });

      const response = await fetcher.get(url, config as FetchConfig);
      let result = response.data as T;
      if (schema) {
        result = schema.parse(result) as T;
      }
      if (select) {
        result = select(result);
      }

      queryClient.set(cacheKey, {
        data: result,
        error: undefined,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
        isPlaceholderData: false,
      });
    } catch (error: any) {
      queryClient.set(cacheKey, {
        data: undefined,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
        isPlaceholderData: false,
      });
    }
  };

  const refetch = () => {
    queryClient.set(cacheKey, { ...state, isFetching: true });
    fetchData();
  };

  return {
    ...state,
    isLoading: state.isLoading,
    refetch,
    isFetching: state.isFetching,
    isError: !!state.error,
    isSuccess: !state.isLoading && !state.error && state.data !== undefined,
    isStale: state.updatedAt ? Date.now() - state.updatedAt >= staleTime : true,
    data: state.data,
    error: state.error as E,
    isPlaceholderData: state.isPlaceholderData ?? false,
  };
}
