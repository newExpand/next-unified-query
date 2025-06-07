import { useEffect, useReducer, useRef, useState } from "react";
import type { ZodType } from "zod/v4";
import { serializeQueryKey } from "./query-cache.js";
import type { FetchConfig } from "../types/index.js";
import { isObject, has } from "es-toolkit/compat";
import { merge } from "es-toolkit/object";
import { isNotNil, isFunction } from "es-toolkit/predicate";
import type { QueryState } from "./query-cache.js";
import { useQueryClient } from "./query-client-provider";
import type {
  QueryConfig,
  ExtractParams,
  ExtractData,
} from "./query-factory.js";

export interface UseQueryOptions<T = any> {
  key: readonly unknown[]; // 쿼리키는 팩토리/상수로 명시적으로 받음
  url: string;
  params?: Record<string, any>;
  schema?: ZodType;
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
  /**
   * placeholderData: fetch 전 임시 데이터 또는 이전 데이터 유지
   * 값 또는 함수(prevData: T | undefined => T) 모두 지원
   * ReactNode(JSX)도 허용
   */
  placeholderData?:
    | T
    | React.ReactNode
    | ((prevData: T | React.ReactNode | undefined) => T | React.ReactNode);
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

/**
 * placeholderData, prevData, enabled를 받아 placeholder 상태를 반환합니다.
 */
function getPlaceholderState<T>(
  placeholderData: UseQueryOptions<T>["placeholderData"],
  prevData: T | undefined,
  enabled: boolean
): QueryState<T> {
  if (isFunction(placeholderData)) {
    return {
      data: (placeholderData as (prev: T | undefined) => T)(prevData),
      error: undefined,
      isLoading: enabled,
      isFetching: enabled,
      updatedAt: 0,
    };
  }
  if (isNotNil(placeholderData) && !isFunction(placeholderData)) {
    return {
      data: placeholderData as T,
      error: undefined,
      isLoading: enabled,
      isFetching: enabled,
      updatedAt: 0,
    };
  }
  if (isNotNil(prevData)) {
    return {
      data: prevData,
      error: undefined,
      isLoading: enabled,
      isFetching: enabled,
      updatedAt: 0,
    };
  }
  return {
    data: undefined,
    error: undefined,
    isLoading: enabled,
    isFetching: enabled,
    updatedAt: 0,
  };
}

// 1. 팩토리 기반 (schema 있으면 자동 추론)
export function useQuery<Q extends QueryConfig<any, any>>(
  query: Q,
  ...options: ExtractParams<Q> extends void
    ? [
        opts?: Omit<
          UseQueryFactoryOptions<ExtractParams<Q>, ExtractData<Q>>,
          "params"
        >
      ]
    : [opts: UseQueryFactoryOptions<ExtractParams<Q>, ExtractData<Q>>]
): ReturnType<typeof _useQueryOptions<ExtractData<Q>, any>>;

// 2. 팩토리 기반 + 명시적 타입 (schema 없어도 됨)
export function useQuery<T, E = unknown>(
  query: QueryConfig<any, any>,
  ...options: any[]
): ReturnType<typeof _useQueryOptions<T, E>>;

// 3. 기존 방식 (명시적 타입, schema 없어도 됨)
export function useQuery<T = unknown, E = unknown>(
  options: UseQueryOptions<T>
): ReturnType<typeof _useQueryOptions<T, E>>;

// 실제 구현
export function useQuery(arg1: any, ...arg2: any[]): any {
  const options = arg2[0] ?? {};
  if (
    isObject(arg1) &&
    has(arg1, "key") &&
    isFunction((arg1 as QueryConfig<any, any>).key) &&
    isFunction((arg1 as QueryConfig<any, any>).url)
  ) {
    // 팩토리 기반
    const query = arg1 as QueryConfig<any, any>;
    const params = options.params;
    const key = query.key(params);
    const url = query.url(params);
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
  // 기존 방식
  return _useQueryOptions(arg1);
}

// 내부 구현: 기존 방식
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

  // useReducer로 상태 관리 (key, placeholderData, enabled가 바뀌면 초기화)
  const [state, setState] = useReducer(
    (prev: QueryState<T>, action: Partial<QueryState<T>> | "reset") => {
      if (action === "reset") {
        const cached = queryClient.get<T>(cacheKey);
        if (cached) return { ...cached, isFetching: false };
        const placeholder = getPlaceholderState(
          placeholderData,
          prev?.data as T | undefined,
          enabled
        );
        return {
          ...placeholder,
          isFetching: placeholder.isLoading, // isLoading이 true면 isFetching도 true
        };
      }
      return { ...prev, ...action };
    },
    undefined,
    () => {
      const cached = queryClient.get<T>(cacheKey);
      if (cached) return { ...cached, isFetching: false };
      const placeholder = getPlaceholderState(
        placeholderData,
        undefined,
        enabled
      );
      return {
        ...placeholder,
        isFetching: placeholder.isLoading, // isLoading이 true면 isFetching도 true
      };
    }
  );

  const calledRef = useRef(false);

  const isStale = (() => {
    if (!state || !state.updatedAt) return true;
    return Date.now() - state.updatedAt >= staleTime;
  })();

  useEffect(() => {
    queryClient.subscribe(key);
    return () => {
      queryClient.unsubscribe(key, cacheTime);
    };
  }, [cacheKey, cacheTime, queryClient]);

  useEffect(() => {
    setState("reset");
    calledRef.current = false;
  }, [cacheKey]);

  useEffect(() => {
    if (!enabled) return;
    if (!calledRef.current) {
      calledRef.current = true;
      if (
        state &&
        state.updatedAt &&
        Date.now() - state.updatedAt < staleTime
      ) {
        return;
      }
      fetchData();
    }
  }, [cacheKey, enabled, staleTime, state.updatedAt]);

  const [hydratedOnClient, setHydratedOnClient] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && state && state.updatedAt) {
      setHydratedOnClient(true);
    }
  }, []);

  const computedIsLoading =
    typeof window !== "undefined" && hydratedOnClient ? false : state.isLoading;

  // 데이터 패칭 함수
  const fetchData = async () => {
    const isInitialLoading = state.data === undefined;
    setState({
      ...state,
      isLoading: isInitialLoading,
      isFetching: true,
    });
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
      setState({
        data: result,
        error: undefined,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
      queryClient.set(cacheKey, {
        data: result,
        error: undefined,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      setState({
        data: undefined,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
      queryClient.set(cacheKey, {
        data: undefined,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now(),
      });
    }
  };

  const refetch = () => {
    fetchData();
  };

  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    const stableRefetch = () => {
      if (enabled) {
        refetchRef.current();
      }
    };
    const unsubscribe = queryClient.subscribeListener(key, stableRefetch);
    return unsubscribe;
  }, [cacheKey, enabled, queryClient]);

  // --- TanStack v5 스타일: isFetching 중에도 placeholderData(prev)를 data로 사용 ---
  let data = state.data as T;
  let isPlaceholderData = false;

  // 1. 최초 로딩 시 placeholderData
  if (computedIsLoading && placeholderData) {
    data = isFunction(placeholderData)
      ? (placeholderData(undefined) as T)
      : (placeholderData as T);
    isPlaceholderData = true;
  }

  // 2. refetch(갱신) 중에도 이전 데이터로 placeholderData(prev)를 사용
  if (
    !computedIsLoading &&
    state.isFetching &&
    placeholderData &&
    state.data !== undefined
  ) {
    data = isFunction(placeholderData)
      ? (placeholderData(state.data as T) as T)
      : (placeholderData as T);
    isPlaceholderData = true;
  }

  return {
    ...state,
    isLoading: computedIsLoading,
    refetch,
    isFetching: state.isFetching,
    isError: !!state.error,
    isSuccess: !computedIsLoading && !state.error && state.data !== undefined,
    isStale,
    data,
    error: state.error as E,
    isPlaceholderData,
  };
}
