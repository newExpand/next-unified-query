import { useReducer, useCallback, useRef } from "react";
import type {
  FetchError,
  ApiErrorResponse,
  HttpMethod,
  RequestConfig,
  QueryKey,
  NextTypeFetch,
} from "next-unified-query-core";
import { useQueryClient } from "../query-client-provider";
import { z, type ZodType } from "next-unified-query-core";
import { merge, isArray, isFunction } from "es-toolkit/compat";


/**
 * Mutation 상태 인터페이스
 */
export interface MutationState<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = void
> {
  data: TData | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * 기본 UseMutation 옵션 (공통 속성)
 */
interface BaseUseMutationOptions<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = void,
  TContext = unknown
> {
  cacheKey?: QueryKey;
  onMutate?: (
    variables: TVariables
  ) => Promise<TContext | void> | TContext | void;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  invalidateQueries?:
    | QueryKey[]
    | ((
        data: TData,
        variables: TVariables,
        context: TContext | undefined
      ) => QueryKey[]);
  fetchConfig?: Omit<
    RequestConfig,
    "url" | "method" | "params" | "data" | "schema"
  >;
  requestSchema?: ZodType;
  responseSchema?: ZodType;
}

/**
 * URL 기반 UseMutation 옵션
 */
interface UrlBasedUseMutationOptions<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = void,
  TContext = unknown
> extends BaseUseMutationOptions<TData, TError, TVariables, TContext> {
  /**
   * API 요청 URL
   */
  url: string | ((variables: TVariables) => string);

  /**
   * HTTP 메서드
   */
  method: HttpMethod;

  /**
   * mutationFn이 있으면 안됨 (상호 배제)
   */
  mutationFn?: never;
}

/**
 * Function 기반 UseMutation 옵션 (통일된 시그니처)
 */
interface UnifiedMutationOptions<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = any,
  TContext = unknown
> extends BaseUseMutationOptions<TData, TError, TVariables, TContext> {
  /**
   * Unified mutation function - 모든 경우에 (variables, fetcher) 패턴 사용
   * void mutation인 경우 variables를 _ 또는 무시하고 사용
   */
  mutationFn: (variables: TVariables, fetcher: NextTypeFetch) => Promise<TData>;

  /**
   * url/method가 있으면 안됨 (상호 배제)
   */
  url?: never;
  method?: never;
}


/**
 * UseMutation 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
export type UseMutationOptions<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = any,
  TContext = unknown
> =
  | UrlBasedUseMutationOptions<TData, TError, TVariables, TContext>
  | UnifiedMutationOptions<TData, TError, TVariables, TContext>;

/**
 * 모든 가능한 UseMutation 옵션 타입의 Union
 */
type AnyUseMutationOptions = 
  | UnifiedMutationOptions<any, any, any, any>
  | UrlBasedUseMutationOptions<any, any, any, any>;


/**
 * UseMutation 결과 인터페이스 (단순화된 시그니처)
 */
export interface UseMutationResult<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = any
> extends MutationState<TData, TError, TVariables> {
  mutate: (
    variables: TVariables,
    options?: {
      onSuccess?: (data: TData, variables: TVariables, context: any) => void;
      onError?: (error: TError, variables: TVariables, context: any) => void;
      onSettled?: (
        data: TData | undefined,
        error: TError | null,
        variables: TVariables,
        context: any
      ) => void;
    }
  ) => void;
  mutateAsync: (
    variables: TVariables,
    options?: {
      onSuccess?: (data: TData, variables: TVariables, context: any) => void;
      onError?: (error: TError, variables: TVariables, context: any) => void;
      onSettled?: (
        data: TData | undefined,
        error: TError | null,
        variables: TVariables,
        context: any
      ) => void;
    }
  ) => Promise<TData>;
  reset: () => void;
}

type MutationAction<TData, TError, TVariables> =
  | { type: "MUTATE"; variables: TVariables }
  | { type: "SUCCESS"; data: TData }
  | { type: "ERROR"; error: TError }
  | { type: "RESET" };

const getInitialState = <TData, TError, TVariables>(): MutationState<
  TData,
  TError,
  TVariables
> => ({
  data: undefined,
  error: null,
  isPending: false,
  isSuccess: false,
  isError: false,
});

// Unified useMutation - 단일 시그니처로 통일
export function useMutation<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = any, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables> {
  return _useMutationInternal(options as any);
}

/**
 * 내부 구현 함수
 */
function _useMutationInternal<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = any,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables> {
  const queryClient = useQueryClient();
  const fetcher = queryClient.getFetcher();

  // 통일된 시그니처 사용: 모든 mutation이 (variables, fetcher) 패턴 사용

  const [state, dispatch] = useReducer(
    (
      prevState: MutationState<TData, TError, TVariables>,
      action: MutationAction<TData, TError, TVariables>
    ): MutationState<TData, TError, TVariables> => {
      switch (action.type) {
        case "MUTATE":
          return {
            ...prevState,
            isPending: true,
            isSuccess: false,
            isError: false,
            error: null,
          };
        case "SUCCESS":
          return {
            ...prevState,
            isPending: false,
            isSuccess: true,
            isError: false,
            data: action.data,
            error: null,
          };
        case "ERROR":
          return {
            ...prevState,
            isPending: false,
            isSuccess: false,
            isError: true,
            error: action.error,
          };
        case "RESET":
          return getInitialState();
        default:
          return prevState;
      }
    },
    getInitialState<TData, TError, TVariables>()
  );

  const latestOptions = useRef(options);
  latestOptions.current = options;

  // Mutation 함수 생성
  const getMutationFn = useCallback(() => {
    if ("mutationFn" in options && options.mutationFn) {
      // 통일된 시그니처: 모든 mutationFn은 (variables, fetcher) 패턴을 사용
      return options.mutationFn;
    }
    
    // URL + Method 기반 mutation 함수 생성
    return async (variables: TVariables, fetcher: NextTypeFetch) => {
      const urlBasedOptions = options as UrlBasedUseMutationOptions<TData, TError, TVariables, TContext>;
      const url = isFunction(urlBasedOptions.url) ? urlBasedOptions.url(variables) : urlBasedOptions.url;
      const method = urlBasedOptions.method;

      // 요청 데이터 검증
      let dataForRequest: any = variables;
      if (options.requestSchema) {
        try {
          dataForRequest = options.requestSchema.parse(variables);
        } catch (e) {
          if (e instanceof z.ZodError) {
            const validationError = new Error(
              `Request validation failed: ${e.issues
                .map((issue) => issue.message)
                .join(", ")}`
            ) as any;
            validationError.isValidationError = true;
            validationError.details = e.issues;
            throw validationError;
          }
          throw e;
        }
      }

      const requestConfig: RequestConfig = merge(
        { schema: options.responseSchema },
        options.fetchConfig || {},
        {
          url: url as string,
          method: method as HttpMethod,
          data: dataForRequest,
        }
      );

      const response = await fetcher.request(requestConfig);
      return response.data;
    };
  }, [options, fetcher]);

  const mutateCallback = useCallback(
    async (
      variables: TVariables,
      mutateLocalOptions?: {
        onSuccess?: (
          data: TData,
          variables: TVariables,
          context: TContext | undefined
        ) => void;
        onError?: (
          error: TError,
          variables: TVariables,
          context: TContext | undefined
        ) => void;
        onSettled?: (
          data: TData | undefined,
          error: TError | null,
          variables: TVariables,
          context: TContext | undefined
        ) => void;
      }
    ): Promise<TData> => {
      dispatch({ type: "MUTATE", variables });
      let context: TContext | void | undefined;

      try {
        // onMutate 콜백
        const onMutateCb = latestOptions.current.onMutate;
        if (onMutateCb) {
          context = await onMutateCb(variables as any);
        }

        // 실제 mutation 함수 실행
        const mutationFn = getMutationFn();
        const data = await mutationFn(variables, fetcher) as TData;
        dispatch({ type: "SUCCESS", data });

        // onSuccess 콜백들 실행
        if (latestOptions.current.onSuccess) {
          await latestOptions.current.onSuccess(data, variables as any, context as TContext);
        }
        if (mutateLocalOptions?.onSuccess) {
          mutateLocalOptions.onSuccess(data, variables as any, context as TContext);
        }

        // invalidateQueries 처리
        const invalidateQueriesOption = latestOptions.current.invalidateQueries;
        if (invalidateQueriesOption) {
          let keysToInvalidate: QueryKey[];

          if (isFunction(invalidateQueriesOption)) {
            keysToInvalidate = invalidateQueriesOption(
              data,
              variables as any,
              context as TContext
            ) as QueryKey[];
          } else {
            keysToInvalidate = invalidateQueriesOption as QueryKey[];
          }

          if (isArray(keysToInvalidate)) {
            keysToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries(queryKey);
            });
          }
        }

        // onSettled 콜백들 실행
        if (latestOptions.current.onSettled) {
          await latestOptions.current.onSettled(
            data,
            null,
            variables as any,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onSettled) {
          mutateLocalOptions.onSettled(
            data,
            null,
            variables as any,
            context as TContext
          );
        }

        return data as TData;
      } catch (err) {
        const error = err as TError;
        dispatch({ type: "ERROR", error });

        // onError 콜백들 실행
        if (latestOptions.current.onError) {
          await latestOptions.current.onError(error, variables as any, context as TContext);
        }
        if (mutateLocalOptions?.onError) {
          mutateLocalOptions.onError(error, variables as any, context as TContext);
        }

        // onSettled 콜백들 실행
        if (latestOptions.current.onSettled) {
          await latestOptions.current.onSettled(
            undefined,
            error,
            variables as any,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onSettled) {
          mutateLocalOptions.onSettled(
            undefined,
            error,
            variables as any,
            context as TContext
          );
        }

        throw error;
      }
    },
    [getMutationFn, queryClient, fetcher]
  );

  const mutate = useCallback(
    (variables: TVariables, localOptions?: any) => {
      mutateCallback(variables, localOptions).catch(() => {
        // mutateAsync에서 에러를 처리하므로, 여기서는 특별한 처리를 하지 않음
      });
    },
    [mutateCallback]
  );

  const mutateAsync = useCallback(
    (variables: TVariables, localOptions?: any): Promise<TData> => {
      return mutateCallback(variables, localOptions);
    },
    [mutateCallback]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    ...state,
    mutate: mutate as any,
    mutateAsync: mutateAsync as any,
    reset,
  };
}