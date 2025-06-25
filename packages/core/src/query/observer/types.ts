import type { QueryState } from "../cache/query-cache";
import type { FetchConfig, QueryFetcher } from "../../types/index";
import type { ZodType } from "zod/v4";

/**
 * 기본 QueryObserver 옵션 (공통 속성)
 */
interface BaseQueryObserverOptions<T = any> {
  key: readonly unknown[];
  params?: Record<string, any>;
  schema?: ZodType;
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  enabled?: boolean;
  staleTime?: number;
  select?: (data: T) => any;
  placeholderData?:
    | T
    | React.ReactNode
    | ((
        prevData: T | React.ReactNode | undefined,
        prevQuery?: QueryState<T> | undefined
      ) => T | React.ReactNode);
  gcTime?: number;
}

/**
 * URL 기반 QueryObserver 옵션
 */
interface UrlBasedQueryObserverOptions<T = any>
  extends BaseQueryObserverOptions<T> {
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
 * Custom Function 기반 QueryObserver 옵션
 */
interface FunctionBasedQueryObserverOptions<T = any>
  extends BaseQueryObserverOptions<T> {
  /**
   * Custom query function for complex requests
   * QueryFetcher를 사용하여 GET/HEAD 메서드만 허용
   * Options 방식에서는 fetcher만 받고, Factory 방식에서는 params와 fetcher를 받음
   */
  queryFn:
    | ((fetcher: QueryFetcher) => Promise<any>)
    | ((params: any, fetcher: QueryFetcher) => Promise<any>);

  /**
   * url이 있으면 안됨 (상호 배제)
   */
  url?: never;
}

/**
 * QueryObserver 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
export type QueryObserverOptions<T = any> =
  | UrlBasedQueryObserverOptions<T>
  | FunctionBasedQueryObserverOptions<T>;

export interface QueryObserverResult<T = unknown, E = unknown> {
  data?: T;
  error?: E;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  isStale: boolean;
  isPlaceholderData: boolean;
  refetch: () => void;
}
