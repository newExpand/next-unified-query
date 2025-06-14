import {
  useEffect,
  useRef,
  useSyncExternalStore,
  useMemo,
  useCallback,
} from "react";
import type { ZodType } from "zod/v4";
import type { FetchConfig } from "../types/index.js";
import { isObject, has } from "es-toolkit/compat";
import { isFunction } from "es-toolkit/predicate";
import { useQueryClient } from "./query-client-provider";
import type { QueryConfig, ExtractParams } from "./query-factory.js";
import {
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from "./query-observer.js";

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

    return _useQueryObserver({
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

  // TanStack Query v5: getSnapshot 결과 캐싱으로 참조 안정성 보장
  const lastSnapshotRef = useRef<QueryObserverResult<T, E> | null>(null);

  // 옵션을 해시로 변환 (함수 제외)
  const createOptionsHash = (opts: UseQueryOptions<T>): string => {
    const hashableOptions = {
      key: opts.key,
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
    observerRef.current = new QueryObserver<T, E>(
      queryClient,
      options as QueryObserverOptions<T>
    );
    optionsHashRef.current = currentHash;
  } else if (shouldUpdate) {
    // TanStack Query처럼 렌더링 중에 직접 업데이트
    observerRef.current.setOptions(options as QueryObserverOptions<T>);
    optionsHashRef.current = currentHash;
  }

  // TanStack Query v5: 안정적인 subscribe 함수
  const subscribe = useCallback((callback: () => void) => {
    return observerRef.current!.subscribe(callback);
  }, []);

  // TanStack Query v5: 최적화된 getSnapshot 함수
  const getSnapshot = useCallback(() => {
    if (!observerRef.current) {
      // Observer가 없는 경우 기본 결과 반환
      const defaultResult = {
        data: undefined,
        error: undefined,
        isLoading: true,
        isFetching: true,
        isError: false,
        isSuccess: false,
        isStale: true,
        isPlaceholderData: false,
        refetch: () => {},
      };
      lastSnapshotRef.current = defaultResult;
      return defaultResult;
    }

    const currentResult = observerRef.current.getCurrentResult();

    // TanStack Query v5: Structural Sharing 적용
    // 결과가 실제로 변경된 경우에만 새 참조 반환
    if (lastSnapshotRef.current) {
      const hasChanged =
        lastSnapshotRef.current.data !== currentResult.data ||
        lastSnapshotRef.current.error !== currentResult.error ||
        lastSnapshotRef.current.isLoading !== currentResult.isLoading ||
        lastSnapshotRef.current.isFetching !== currentResult.isFetching ||
        lastSnapshotRef.current.isError !== currentResult.isError ||
        lastSnapshotRef.current.isSuccess !== currentResult.isSuccess ||
        lastSnapshotRef.current.isStale !== currentResult.isStale ||
        lastSnapshotRef.current.isPlaceholderData !==
          currentResult.isPlaceholderData;

      if (!hasChanged) {
        // 변경사항이 없으면 기존 참조 유지 (렌더링 최적화)
        return lastSnapshotRef.current;
      }
    }

    // 변경사항이 있는 경우에만 새 참조 저장
    lastSnapshotRef.current = currentResult;
    return currentResult;
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
      lastSnapshotRef.current = null;
    };
  }, []);

  return result;
}
