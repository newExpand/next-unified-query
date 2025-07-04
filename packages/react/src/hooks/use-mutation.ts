import { useReducer, useCallback, useRef } from "react";
import type {
  FetchError,
  ApiErrorResponse,
  HttpMethod,
  RequestConfig,
} from "next-unified-query-core";
import { validateMutationConfig, type MutationConfig, type InferIfZodSchema } from "next-unified-query-core";
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
  TContext = unknown,
  RequestSchema extends ZodType = ZodType,
  ResponseSchema extends ZodType = ZodType
> {
  onMutate?: (
    variables: TVariables
  ) => Promise<TContext | void> | TContext | void;
  onSuccess?: (
    data: InferIfZodSchema<ResponseSchema, TData>,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  onSettled?: (
    data: InferIfZodSchema<ResponseSchema, TData> | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;
  invalidateQueries?:
    | string[][]
    | ((
        data: InferIfZodSchema<ResponseSchema, TData>,
        variables: TVariables,
        context: TContext | undefined
      ) => string[][]);
  fetchConfig?: Omit<
    RequestConfig,
    "url" | "method" | "params" | "data" | "schema"
  >;
  requestSchema?: RequestSchema;
  responseSchema?: ResponseSchema;
}

/**
 * URL 기반 UseMutation 옵션
 */
interface UrlBasedUseMutationOptions<
  TData = unknown,
  TError = FetchError<ApiErrorResponse>,
  TVariables = void,
  TContext = unknown,
  RequestSchema extends ZodType = ZodType,
  ResponseSchema extends ZodType = ZodType
> extends BaseUseMutationOptions<TData, TError, TVariables, TContext, RequestSchema, ResponseSchema> {
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
  TContext = unknown,
  RequestSchema extends ZodType = ZodType,
  ResponseSchema extends ZodType = ZodType
> extends BaseUseMutationOptions<TData, TError, TVariables, TContext, RequestSchema, ResponseSchema> {
  /**
   * Unified mutation function - 모든 경우에 (variables, fetcher) 패턴 사용
   * void mutation인 경우 variables를 _ 또는 무시하고 사용
   */
  mutationFn: (variables: TVariables, fetcher: any) => Promise<InferIfZodSchema<ResponseSchema, TData>>;

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
  TContext = unknown,
  RequestSchema extends ZodType = ZodType,
  ResponseSchema extends ZodType = ZodType
> =
  | UrlBasedUseMutationOptions<TData, TError, TVariables, TContext, RequestSchema, ResponseSchema>
  | UnifiedMutationOptions<TData, TError, TVariables, TContext, RequestSchema, ResponseSchema>;



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

/**
 * useMutation 오버로드 선언
 */
// 스키마가 제공될 때 타입 추론
export function useMutation<
  TVariables = any,
  TError = FetchError<ApiErrorResponse>,
  TContext = unknown,
  RequestSchema extends ZodType = ZodType,
  ResponseSchema extends ZodType = ZodType
>(
  options: UseMutationOptions<unknown, TError, TVariables, TContext, RequestSchema, ResponseSchema> & {
    responseSchema: ResponseSchema;
  }
): UseMutationResult<z.infer<ResponseSchema>, TError, TVariables>;

// Factory 기반
export function useMutation<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = any, TContext = unknown>(
  factoryConfig: MutationConfig<TVariables, TData, TError, TContext>,
  overrideOptions?: Partial<BaseUseMutationOptions<TData, TError, TVariables, TContext>>
): UseMutationResult<TData, TError, TVariables>;

// 일반 옵션 기반
export function useMutation<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = any, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables>;

// 구현
export function useMutation<TData = unknown, TError = FetchError<ApiErrorResponse>, TVariables = any, TContext = unknown>(
  configOrOptions: MutationConfig<TVariables, TData, TError, TContext> | UseMutationOptions<TData, TError, TVariables, TContext>,
  overrideOptions?: Partial<BaseUseMutationOptions<TData, TError, TVariables, TContext>>
): UseMutationResult<TData, TError, TVariables> {
  // Factory 기반인지 확인 (cacheKey 등 factory 특성이 있는지 확인)
  const isFactoryConfig = 'url' in configOrOptions || 'mutationFn' in configOrOptions;
  
  if (isFactoryConfig && overrideOptions) {
    // Factory 기반 + override options
    const factoryConfig = configOrOptions as MutationConfig<TVariables, TData, TError, TContext>;
    const mergedOptions = mergeMutationOptions(factoryConfig, overrideOptions);
    return _useMutationInternal(mergedOptions);
  } else {
    // Options 기반 또는 Factory 기반 (override 없음)
    return _useMutationInternal(configOrOptions as any);
  }
}

/**
 * Factory 옵션과 useMutation 옵션을 병합하는 함수
 */
function mergeMutationOptions<TData, TError, TVariables, TContext>(
  factoryConfig: MutationConfig<TVariables, TData, TError, TContext>,
  overrideOptions: Partial<BaseUseMutationOptions<TData, TError, TVariables, TContext>>
): UseMutationOptions<TData, TError, TVariables, TContext> {
  // Factory 콜백들
  const factoryOnMutate = factoryConfig.onMutate;
  const factoryOnSuccess = factoryConfig.onSuccess;
  const factoryOnError = factoryConfig.onError;
  const factoryOnSettled = factoryConfig.onSettled;

  // Override 콜백들
  const overrideOnMutate = overrideOptions.onMutate;
  const overrideOnSuccess = overrideOptions.onSuccess;
  const overrideOnError = overrideOptions.onError;
  const overrideOnSettled = overrideOptions.onSettled;

  return {
    // Factory 기본 속성들
    ...factoryConfig,
    
    // Override 옵션들로 덮어쓰기 (콜백 제외)
    ...overrideOptions,
    
    // 콜백들은 양쪽 모두 실행하도록 병합
    onMutate: combinedCallback(factoryOnMutate, overrideOnMutate),
    onSuccess: combinedCallback(factoryOnSuccess, overrideOnSuccess),
    onError: combinedCallback(factoryOnError, overrideOnError),
    onSettled: combinedCallback(factoryOnSettled, overrideOnSettled),
  } as UseMutationOptions<TData, TError, TVariables, TContext>;
}

/**
 * 두 콜백을 결합하여 순서대로 실행하는 함수 생성
 */
function combinedCallback<T extends (...args: any[]) => any>(
  first?: T,
  second?: T
): T | undefined {
  if (!first && !second) return undefined;
  if (!first) return second;
  if (!second) return first;

  return ((...args: Parameters<T>) => {
    // Factory 콜백 먼저 실행
    const firstResult = first(...args);
    // Override 콜백 실행
    const secondResult = second(...args);
    
    // Promise인 경우 체인으로 연결
    if (firstResult && typeof firstResult.then === 'function') {
      return firstResult.then(() => secondResult);
    }
    
    return secondResult;
  }) as T;
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

  // 런타임 검증 (개발 환경에서만)
  if (process.env.NODE_ENV !== 'production') {
    try {
      validateMutationConfig(options as any);
    } catch (error) {
      throw error; // 검증 실패 시 에러를 그대로 던짐
    }
  }

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
    return async (variables: TVariables, fetcher: any) => {
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
          let keysToInvalidate: string[][];

          if (isFunction(invalidateQueriesOption)) {
            keysToInvalidate = invalidateQueriesOption(
              data,
              variables as any,
              context as TContext
            ) as string[][];
          } else {
            keysToInvalidate = invalidateQueriesOption as string[][];
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