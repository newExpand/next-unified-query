import type { QueryState } from "../cache/query-cache";
import type { FetchConfig } from "../../types/index";
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
