import { useEffect, useReducer, useRef } from "react";
import type { z, ZodTypeAny } from "zod";
import { serializeQueryKey } from "./query-cache.js";
import type { FetchConfig } from "../types/index.js";
import { isObject, has } from "es-toolkit/compat";
import { merge } from "es-toolkit/object";
import { isNotNil, isFunction } from "es-toolkit/predicate";
import type { QueryState } from "./query-cache.js";
import { useQueryClient } from "./query-client-provider";
import type { QueryConfig, ExtractParams } from "./query-factory.js";

export interface UseQueryOptions<T = unknown> {
  key: readonly unknown[]; // 쿼리키는 팩토리/상수로 명시적으로 받음
  url: string;
  params?: Record<string, any>;
  schema?: z.ZodTypeAny;
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

/**
 * placeholderData, prevData, enabled를 받아 placeholder 상태를 반환합니다.
 */
function getPlaceholderState<T>(
  placeholderData: UseQueryOptions<T>["placeholderData"],
  prevData: T | React.ReactNode | undefined,
  enabled: boolean
): QueryState<T | React.ReactNode> {
  if (isFunction(placeholderData)) {
    return {
      data: (
        placeholderData as (
          prev: T | React.ReactNode | undefined
        ) => T | React.ReactNode
      )(prevData),
      error: undefined,
      isLoading: enabled,
      updatedAt: 0,
    };
  }
  if (isNotNil(placeholderData) && !isFunction(placeholderData)) {
    return {
      data: placeholderData as T | React.ReactNode,
      error: undefined,
      isLoading: enabled,
      updatedAt: 0,
    };
  }
  if (isNotNil(prevData)) {
    return {
      data: prevData,
      error: undefined,
      isLoading: enabled,
      updatedAt: 0,
    };
  }
  return {
    data: undefined,
    error: undefined,
    isLoading: enabled,
    updatedAt: 0,
  };
}

// 오버로드: 선언부 기반 + 기존 방식 모두 지원
export function useQuery<
  Q extends QueryConfig<any, ZodTypeAny | undefined>,
  T = Q["schema"] extends ZodTypeAny ? z.infer<Q["schema"]> : unknown
>(queryOrOptions: Q | UseQueryOptions<T>, params?: ExtractParams<Q>): any {
  if (
    isNotNil(params) &&
    isObject(queryOrOptions) &&
    has(queryOrOptions, "key") &&
    isFunction((queryOrOptions as any).key) &&
    isFunction((queryOrOptions as any).url)
  ) {
    // 선언부 기반
    const query = queryOrOptions as Q;
    const key = query.key(params as ExtractParams<Q>);
    const url = query.url(params as ExtractParams<Q>);
    const schema = query.schema;
    const placeholderData = query.placeholderData;
    const fetchConfig = query.fetchConfig;
    const select = query.select;
    const enabled = isFunction(query.enabled)
      ? query.enabled(params as ExtractParams<Q>)
      : query.enabled;
    return useQuery({
      key,
      url,
      schema,
      placeholderData,
      fetchConfig,
      select,
      enabled,
    });
  }
  // 기존 방식
  return _useQueryOptions(queryOrOptions as UseQueryOptions<T>);
}

// 내부 구현: 기존 방식
function _useQueryOptions<T = unknown>(options: UseQueryOptions<T>) {
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

  // 쿼리키 직렬화
  const cacheKey = serializeQueryKey(key);

  // useReducer로 상태 관리 (key, placeholderData, enabled가 바뀌면 초기화)
  const [state, setState] = useReducer(
    (
      prev: QueryState<T | React.ReactNode>,
      action: Partial<QueryState<T | React.ReactNode>> | "reset"
    ) => {
      if (action === "reset") {
        const cached = queryClient.get<T | React.ReactNode>(cacheKey);
        if (cached) return cached;
        return getPlaceholderState(placeholderData, prev?.data, enabled);
      }
      return { ...prev, ...action };
    },
    undefined,
    () => {
      const cached = queryClient.get<T | React.ReactNode>(cacheKey);
      if (cached) return cached;
      return getPlaceholderState(placeholderData, undefined, enabled);
    }
  );

  const calledRef = useRef(false);

  // fresh/stale 판단 함수
  const isStale = (() => {
    if (!state || !state.updatedAt) return true;
    return Date.now() - state.updatedAt >= staleTime;
  })();

  // mount/unmount 시 구독자 관리
  useEffect(() => {
    queryClient.subscribe(key);
    return () => {
      queryClient.unsubscribe(key, cacheTime);
    };
  }, [cacheKey, cacheTime]);

  // 쿼리키가 바뀔 때만 state 초기화
  useEffect(() => {
    setState("reset");
    calledRef.current = false;
  }, [cacheKey]);

  // fetchData 트리거 (최초 1회만, fresh면 fetch 생략)
  useEffect(() => {
    if (!enabled) return;
    if (!calledRef.current) {
      calledRef.current = true;
      // fresh면 fetch 생략
      if (
        state &&
        state.updatedAt &&
        Date.now() - state.updatedAt < staleTime
      ) {
        // 캐시가 fresh하므로 fetch 생략
        return;
      }
      fetchData();
    }
  }, [cacheKey, enabled, staleTime]);

  // 데이터 패칭 함수
  const fetchData = async () => {
    setState({ isLoading: true });
    try {
      let config: FetchConfig = merge({}, fetchConfig ?? {});
      if (isNotNil(params)) config = merge(config, { params });
      if (isNotNil(schema)) config = merge(config, { schema });
      const response = await fetcher.get(url, config as FetchConfig);
      let result = response.data as T;
      if (schema) {
        result = schema.parse(result);
      }
      // select 옵션이 있으면 select만 적용, 없으면 원본 데이터 그대로 반환
      if (select) {
        result = select(result);
      }
      setState({
        data: result,
        error: undefined,
        isLoading: false,
        updatedAt: Date.now(),
      });
      queryClient.set(cacheKey, {
        data: result,
        error: undefined,
        isLoading: false,
        updatedAt: Date.now(),
      });
    } catch (error: any) {
      setState({
        data: undefined,
        error,
        isLoading: false,
        updatedAt: Date.now(),
      });
      queryClient.set(cacheKey, {
        data: undefined,
        error,
        isLoading: false,
        updatedAt: Date.now(),
      });
    }
  };

  // refetch 함수 (항상 fetcher 호출)
  const refetch = () => {
    fetchData();
  };

  return {
    ...state,
    refetch,
    isFetching: state.isLoading,
    isError: !!state.error,
    isSuccess: !state.isLoading && !state.error && state.data !== undefined,
    isStale,
  };
}
