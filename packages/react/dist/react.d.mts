import { ZodType } from 'zod/v4';
import { QueryConfig, FetchConfig, ExtractParams, QueryObserverResult, MutationConfig, ExtractMutationVariables, ExtractMutationData, ExtractMutationError, FetchError, NextTypeFetch, QueryKey, RequestConfig, QueryClient, QueryClientOptionsWithInterceptors, InterceptorSetupFunction, QueryState } from 'next-unified-query-core';
import React$1, { ReactNode } from 'react';

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
    /**
     * placeholderData: fetch 전 임시 데이터 또는 이전 데이터 유지
     * 값 또는 함수(prevData, prevQuery) 모두 지원
     * ReactNode(JSX)도 허용
     */
    placeholderData?: T | React.ReactNode | ((prevData: T | React.ReactNode | undefined, prevQuery?: any) => T | React.ReactNode);
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
     */
    queryFn: (params: any, fetcher: any) => Promise<any>;
    /**
     * url이 있으면 안됨 (상호 배제)
     */
    url?: never;
}
/**
 * UseQuery 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
type UseQueryOptions<T = any> = UrlBasedUseQueryOptions<T> | FunctionBasedUseQueryOptions<T>;
type UseQueryFactoryOptions<P, T> = Omit<UseQueryOptions<T>, "cacheKey" | "url" | "queryFn" | "params" | "schema" | "fetchConfig"> & (P extends void ? {
    params?: P;
} : keyof P extends never ? {
    params?: P;
} : {
    params: P;
});
declare function useQuery<T = unknown, E = unknown>(query: QueryConfig<any, any>, options: UseQueryFactoryOptions<ExtractParams<typeof query>, T>): QueryObserverResult<T, E>;
declare function useQuery<T = unknown, E = unknown>(options: UseQueryOptions<T>): QueryObserverResult<T, E>;

interface MutationState<TData = unknown, TError = FetchError, TVariables = void> {
    data: TData | undefined;
    error: TError | null;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
}
interface UseMutationOptions<TData = unknown, TError = FetchError, TVariables = void, TContext = unknown> {
    mutationFn: (variables: TVariables, fetcher: NextTypeFetch) => Promise<TData>;
    cacheKey?: QueryKey;
    onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    invalidateQueries?: QueryKey[] | ((data: TData, variables: TVariables, context: TContext | undefined) => QueryKey[]);
    fetchConfig?: Omit<RequestConfig, "url" | "method" | "params" | "data" | "schema">;
    requestSchema?: ZodType;
    responseSchema?: ZodType;
}
interface UseMutationResult<TData = unknown, TError = FetchError, TVariables = void> extends MutationState<TData, TError, TVariables> {
    mutate: (variables: TVariables, options?: {
        onSuccess?: (data: TData, variables: TVariables, context: any) => void;
        onError?: (error: TError, variables: TVariables, context: any) => void;
        onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void;
    }) => void;
    mutateAsync: (variables: TVariables, options?: {
        onSuccess?: (data: TData, variables: TVariables, context: any) => void;
        onError?: (error: TError, variables: TVariables, context: any) => void;
        onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => void;
    }) => Promise<TData>;
    reset: () => void;
}
declare function useMutation<MC extends MutationConfig<any, any, any, any, any, any>, TVariables = ExtractMutationVariables<MC>, TData = ExtractMutationData<MC>, TError = ExtractMutationError<MC>, TContext = MC extends MutationConfig<any, any, any, infer C, any, any> ? C : unknown>(mutationConfig: MC, options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn" | "cacheKey" | "fetchConfig" | "requestSchema" | "responseSchema">): UseMutationResult<TData, TError, TVariables>;
declare function useMutation<TData = unknown, TError = FetchError, TVariables = void, TContext = unknown>(options: UseMutationOptions<TData, TError, TVariables, TContext>): UseMutationResult<TData, TError, TVariables>;

declare function HydrationBoundary({ state, children, }: {
    state?: Record<string, QueryState>;
    children: ReactNode;
}): React$1.JSX.Element;
interface QueryClientProviderProps {
    /**
     * QueryClient 인스턴스 (선택사항)
     * 제공하지 않으면 자동으로 환경에 맞는 인스턴스를 생성합니다.
     */
    client?: QueryClient;
    /**
     * QueryClient 옵션 (client가 제공되지 않은 경우에만 사용)
     */
    options?: QueryClientOptionsWithInterceptors;
    /**
     * 인터셉터 설정 함수 (client가 제공되지 않은 경우에만 사용)
     * options.setupInterceptors보다 우선순위가 높습니다.
     */
    setupInterceptors?: InterceptorSetupFunction;
    children: ReactNode;
}
declare function QueryClientProvider({ client, options, setupInterceptors, children, }: QueryClientProviderProps): React$1.JSX.Element;
declare function useQueryClient(): QueryClient;

export { HydrationBoundary, QueryClientProvider, useMutation, useQuery, useQueryClient };
