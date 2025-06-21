import { useReducer, useCallback, useRef } from "react";
import type {
  FetchError,
  HttpMethod,
  RequestConfig,
  QueryKey,
  NextTypeFetch,
} from "next-unified-query-core";
import { useQueryClient } from "../query-client-provider";
import type {
  MutationConfig,
  ExtractMutationVariables,
  ExtractMutationData,
  ExtractMutationError,
} from "next-unified-query-core";
import { validateMutationConfig } from "next-unified-query-core";
import { z, ZodType } from "zod/v4";
import { merge, isArray, isFunction } from "es-toolkit/compat";

export interface MutationState<
  TData = unknown,
  TError = FetchError,
  TVariables = void
> {
  data: TData | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseMutationOptions<
  TData = unknown,
  TError = FetchError,
  TVariables = void,
  TContext = unknown
> {
  mutationFn: (variables: TVariables, fetcher: NextTypeFetch) => Promise<TData>; // fetcher를 두 번째 인자로 제공
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
  // 추가적인 fetchConfig 등은 MutationConfig에서 올 수 있음
  fetchConfig?: Omit<
    RequestConfig,
    "url" | "method" | "params" | "data" | "schema"
  >;
  requestSchema?: ZodType;
  responseSchema?: ZodType;
}

export interface UseMutationResult<
  TData = unknown,
  TError = FetchError,
  TVariables = void
  // TContext = unknown, // Result에서는 TContext가 직접적으로 노출될 필요는 없을 수 있음
> extends MutationState<TData, TError, TVariables> {
  mutate: (
    variables: TVariables,
    options?: {
      onSuccess?: (data: TData, variables: TVariables, context: any) => void; // TContext를 any로 단순화 또는 제거 고려
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
 * 옵션 기반 사용법인지 확인하는 타입 가드
 */
function isOptionsBasedUsage(
  arg: any
): arg is UseMutationOptions<any, any, any, any> {
  return isFunction(arg.mutationFn) && !arg.url && !arg.method;
}

/**
 * 팩토리 설정의 유효성을 검증 (factory의 validateMutationConfig 사용)
 */
function validateFactoryConfig(
  config: MutationConfig<any, any, any, any, any, any>
): void {
  validateMutationConfig(config);
}

/**
 * 요청 데이터의 스키마 검증을 수행
 */
function validateRequestData(data: any, schema?: ZodType): any {
  if (!schema) return data;

  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const zodErr = e as z.ZodError;
      const validationError = new Error(
        `Request validation failed: ${zodErr.issues
          .map((issue) => issue.message)
          .join(", ")}`
      ) as any;
      validationError.isValidationError = true;
      validationError.details = zodErr.issues;
      throw validationError;
    }
    throw e;
  }
}

/**
 * URL + Method 기반의 자동 mutation 함수 생성
 */
function createUrlBasedMutationFn(
  config: MutationConfig<any, any, any, any, any, any>
): (variables: any, fetcher: NextTypeFetch) => Promise<any> {
  return async (variables: any, fetcher: NextTypeFetch) => {
    const url = isFunction(config.url) ? config.url(variables) : config.url;
    const method = config.method;

    const dataForRequest = validateRequestData(variables, config.requestSchema);

    const requestConfig: RequestConfig = merge(
      { schema: config.responseSchema },
      config.fetchConfig || {},
      {
        url,
        method: method as HttpMethod,
        data: dataForRequest,
      }
    );

    const response = await fetcher.request(requestConfig);
    return response.data;
  };
}

/**
 * 팩토리 설정에서 mutation 함수 추출
 */
function extractMutationFnFromFactory(
  config: MutationConfig<any, any, any, any, any, any>
): (variables: any, fetcher: NextTypeFetch) => Promise<any> {
  validateFactoryConfig(config);

  if (isFunction(config.mutationFn)) {
    return config.mutationFn;
  }

  return createUrlBasedMutationFn(config);
}

/**
 * 팩토리 기반 설정을 UseMutationOptions로 변환
 */
function convertFactoryToOptions(
  factoryConfig: MutationConfig<any, any, any, any, any, any>,
  overrideOptions: any = {}
): UseMutationOptions<any, any, any, any> {
  const mutationFn = extractMutationFnFromFactory(factoryConfig);

  return merge({}, factoryConfig, overrideOptions, {
    mutationFn,
  });
}

/**
 * 쿼리 무효화 처리
 */
async function handleInvalidateQueries(
  invalidateQueriesOption: any,
  data: any,
  variables: any,
  context: any,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  if (!invalidateQueriesOption) return;

  let keysToInvalidate: QueryKey[];

  if (isFunction(invalidateQueriesOption)) {
    keysToInvalidate = invalidateQueriesOption(
      data,
      variables,
      context
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

/**
 * Success 시 콜백들을 실행
 */
async function executeSuccessCallbacks<TData, TVariables, TContext>(
  data: TData,
  variables: TVariables,
  context: TContext | undefined,
  options: {
    hookOnSuccess?: (
      data: TData,
      variables: TVariables,
      context: TContext | undefined
    ) => Promise<void> | void;
    localOnSuccess?: (
      data: TData,
      variables: TVariables,
      context: TContext | undefined
    ) => void;
  }
): Promise<void> {
  if (options.hookOnSuccess) {
    await options.hookOnSuccess(data, variables, context);
  }
  if (options.localOnSuccess) {
    options.localOnSuccess(data, variables, context);
  }
}

/**
 * Error 시 콜백들을 실행
 */
async function executeErrorCallbacks<TError, TVariables, TContext>(
  error: TError,
  variables: TVariables,
  context: TContext | undefined,
  options: {
    hookOnError?: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined
    ) => Promise<void> | void;
    localOnError?: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined
    ) => void;
  }
): Promise<void> {
  if (options.hookOnError) {
    await options.hookOnError(error, variables, context);
  }
  if (options.localOnError) {
    options.localOnError(error, variables, context);
  }
}

/**
 * Settled 시 콜백들을 실행
 */
async function executeSettledCallbacks<TData, TError, TVariables, TContext>(
  data: TData | undefined,
  error: TError | null,
  variables: TVariables,
  context: TContext | undefined,
  options: {
    hookOnSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined
    ) => Promise<void> | void;
    localOnSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      context: TContext | undefined
    ) => void;
  }
): Promise<void> {
  if (options.hookOnSettled) {
    await options.hookOnSettled(data, error, variables, context);
  }
  if (options.localOnSettled) {
    options.localOnSettled(data, error, variables, context);
  }
}

// 팩토리 기반 오버로드
export function useMutation<
  MC extends MutationConfig<any, any, any, any, any, any>,
  TVariables = ExtractMutationVariables<MC>,
  TData = ExtractMutationData<MC>,
  TError = ExtractMutationError<MC>,
  TContext = MC extends MutationConfig<any, any, any, infer C, any, any>
    ? C
    : unknown
>(
  mutationConfig: MC,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    | "mutationFn"
    | "cacheKey"
    | "fetchConfig"
    | "requestSchema"
    | "responseSchema"
  >
): UseMutationResult<TData, TError, TVariables>;

// 옵션 객체 기반 오버로드
export function useMutation<
  TData = unknown,
  TError = FetchError,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables>;

// 실제 구현
export function useMutation(
  arg1: any, // MutationConfig | UseMutationOptions
  arg2?: any // UseMutationOptions (팩토리 사용 시)
): UseMutationResult<any, any, any> {
  const queryClient = useQueryClient();

  let combinedOptions: UseMutationOptions<any, any, any, any>;

  if (isOptionsBasedUsage(arg1)) {
    // 옵션 객체 기반 시나리오
    combinedOptions = arg1;
  } else {
    // 팩토리 기반 시나리오
    combinedOptions = convertFactoryToOptions(arg1, arg2);
  }

  return _useMutationInternal(combinedOptions, queryClient);
}

// 내부 구현 함수
function _useMutationInternal<
  TData = unknown,
  TError = FetchError,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient: ReturnType<typeof useQueryClient>
): UseMutationResult<TData, TError, TVariables> {
  const fetcher = queryClient.getFetcher();

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
          context = await onMutateCb(variables);
        }

        // 실제 mutation 함수 실행 - fetcher를 두 번째 인자로 전달
        const data = await latestOptions.current.mutationFn(variables, fetcher);
        dispatch({ type: "SUCCESS", data });

        // onSuccess 콜백 (둘 다 실행: 훅 → mutate 옵션)
        await executeSuccessCallbacks(data, variables, context as TContext, {
          hookOnSuccess: latestOptions.current.onSuccess,
          localOnSuccess: mutateLocalOptions?.onSuccess,
        });

        // invalidateQueries 처리
        await handleInvalidateQueries(
          latestOptions.current.invalidateQueries,
          data,
          variables,
          context as TContext,
          queryClient
        );

        // onSettled 콜백 (둘 다 실행: 훅 → mutate 옵션)
        await executeSettledCallbacks(
          data,
          null,
          variables,
          context as TContext,
          {
            hookOnSettled: latestOptions.current.onSettled,
            localOnSettled: mutateLocalOptions?.onSettled,
          }
        );

        return data;
      } catch (err) {
        const error = err as TError;
        dispatch({ type: "ERROR", error });

        // onError 콜백 (둘 다 실행: 훅 → mutate 옵션)
        await executeErrorCallbacks(error, variables, context as TContext, {
          hookOnError: latestOptions.current.onError,
          localOnError: mutateLocalOptions?.onError,
        });

        // onSettled 콜백 (둘 다 실행: 훅 → mutate 옵션)
        await executeSettledCallbacks(
          undefined,
          error,
          variables,
          context as TContext,
          {
            hookOnSettled: latestOptions.current.onSettled,
            localOnSettled: mutateLocalOptions?.onSettled,
          }
        );

        throw error;
      }
    },
    [queryClient, fetcher]
  );

  const mutate = (
    variables: TVariables,
    options?: {
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
  ) => {
    mutateCallback(variables, options).catch(() => {
      // mutateAsync에서 에러를 처리하므로, 여기서는 특별한 처리를 하지 않음
    });
  };

  const mutateAsync = useCallback(
    (
      variables: TVariables,
      options?: {
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
      return mutateCallback(variables, options);
    },
    [mutateCallback]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}
