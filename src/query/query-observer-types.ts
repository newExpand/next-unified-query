import type { QueryState } from "./query-cache";
import type { FetchConfig } from "../types/index";
import type { ZodType } from "zod/v4";

export interface QueryObserverOptions<T = any> {
  key: readonly unknown[];
  url: string;
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

// 결과 계산기 재내보내기
export { ResultComputer } from "./result-computer";

// Fetch 관리자 재내보내기
export { FetchManager } from "./fetch-manager";

// 옵션 관리자 재내보내기
export { OptionsManager, type OptionsChangeCallbacks } from "./options-manager";
