import { useReducer, useCallback, useRef } from "react";
import type {
  FetchError,
  HttpMethod,
  RequestConfig,
  QueryKey,
} from "../types/index.js";
import { useQueryClient } from "./query-client-provider.js";
import type {
  MutationConfig,
  ExtractMutationVariables,
  ExtractMutationData,
  ExtractMutationError,
} from "./mutation-factory.js";
import { z, ZodType } from "zod/v4";
import { merge, isArray, isFunction } from "es-toolkit/compat";

export interface MutationState<
  TData = unknown,
  TError = FetchError,
  TVariables = void
> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  variables: TVariables | undefined;
  // context?: TContext; // context는 mutate 스코프 내에서 관리되므로 상태에 직접 포함하지 않을 수 있음
}

export interface UseMutationOptions<
  TData = unknown,
  TError = FetchError,
  TVariables = void,
  TContext = unknown
> {
  mutationFn?: (variables: TVariables) => Promise<TData>; // 팩토리 사용 시 내부 생성되므로 optional
  mutationKey?: QueryKey;
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
  isLoading: false,
  isSuccess: false,
  isError: false,
  variables: undefined,
});

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
    | "mutationKey"
    | "fetchConfig"
    | "requestSchema"
    | "responseSchema"
  > // 팩토리에서 이미 정의된 것들은 제외하거나 오버라이드 허용
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
  const fetcher = queryClient.getFetcher();

  let combinedOptions: UseMutationOptions<any, any, any, any>;

  if (isFunction(arg1.mutationFn) || (!arg1.url && !arg1.method)) {
    // 옵션 객체 기반 시나리오
    combinedOptions = arg1 as UseMutationOptions<any, any, any, any>;
  } else {
    // 팩토리 기반 시나리오
    const factoryConfig = arg1 as MutationConfig<any, any, any, any, any, any>;
    const overrideOptions = arg2 || {};

    const generatedMutationFn = async (variables: any) => {
      let url = isFunction(factoryConfig.url)
        ? factoryConfig.url(variables)
        : factoryConfig.url;
      const method = factoryConfig.method;

      let dataForRequest = variables;
      if (factoryConfig.requestSchema) {
        try {
          dataForRequest = factoryConfig.requestSchema.parse(variables);
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

      const requestConfig: RequestConfig = merge(
        { schema: factoryConfig.responseSchema },
        factoryConfig.fetchConfig || {},
        {
          url,
          method: method as HttpMethod,
          data: dataForRequest,
        }
      );
      const response = await fetcher.request(requestConfig);
      return response.data;
    };

    // factoryConfig를 기본으로 하고, overrideOptions로 깊게 병합합니다.
    // 이렇게 하면 fetchConfig 같은 중첩 객체가 올바르게 병합됩니다.
    // overrideOptions의 값이 factoryConfig의 값을 덮어씁니다.
    combinedOptions = merge({}, factoryConfig, overrideOptions);

    // mutationFn 처리:
    // 위의 merge로 인해 combinedOptions.mutationFn은
    // overrideOptions.mutationFn (존재하고 undefined가 아니면) 또는
    // factoryConfig.mutationFn (존재하고 undefined가 아니면) 또는
    // undefined가 됩니다.
    // 이들 모두 유효한 함수가 아니었다면 (즉, combinedOptions.mutationFn이 falsy하면)
    // generatedMutationFn을 사용합니다.
    if (!combinedOptions.mutationFn) {
      combinedOptions.mutationFn = generatedMutationFn;
    }
  }

  return _useMutationInternal(combinedOptions, queryClient);
}

// 내부 구현 함수 (기존 useMutation 로직을 여기로 옮기고 수정)
function _useMutationInternal<
  TData = unknown,
  TError = FetchError,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient: ReturnType<typeof useQueryClient> // QueryClient 타입 명시
): UseMutationResult<TData, TError, TVariables> {
  const {
    mutationFn,
    // mutationKey, // devtools 등에서 사용 가능
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateQueries,
  } = options;

  if (!mutationFn) {
    // 이 경우는 팩토리 로직에서 mutationFn이 생성되지 않았거나, 옵션에서 누락된 경우.
    // 실제로는 위 로직에서 mutationFn이 항상 존재하도록 보장되어야 함.
    throw new Error("mutationFn is required");
  }

  const [state, dispatch] = useReducer(
    (
      prevState: MutationState<TData, TError, TVariables>,
      action: MutationAction<TData, TError, TVariables>
    ): MutationState<TData, TError, TVariables> => {
      switch (action.type) {
        case "MUTATE":
          return {
            ...prevState,
            isLoading: true,
            isSuccess: false,
            isError: false,
            error: null,
            variables: action.variables,
          };
        case "SUCCESS":
          return {
            ...prevState,
            isLoading: false,
            isSuccess: true,
            isError: false,
            data: action.data,
            error: null,
          };
        case "ERROR":
          return {
            ...prevState,
            isLoading: false,
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
  latestOptions.current = options; // 콜백 내에서 최신 옵션 참조 위함

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

        // 실제 mutation 함수 실행
        const data = await latestOptions.current.mutationFn!(variables);
        dispatch({ type: "SUCCESS", data });

        // onSuccess 콜백 (둘 다 실행: 훅 → mutate 옵션)
        if (latestOptions.current.onSuccess) {
          await latestOptions.current.onSuccess(
            data,
            variables,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onSuccess) {
          mutateLocalOptions.onSuccess(data, variables, context as TContext);
        }

        // invalidateQueries 처리
        const invalidateQueriesOption = latestOptions.current.invalidateQueries;
        if (invalidateQueriesOption) {
          let keysToInvalidate: QueryKey[];
          if (isFunction(invalidateQueriesOption)) {
            keysToInvalidate = invalidateQueriesOption(
              data,
              variables,
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

        // onSettled 콜백 (둘 다 실행: 훅 → mutate 옵션)
        if (latestOptions.current.onSettled) {
          await latestOptions.current.onSettled(
            data,
            null,
            variables,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onSettled) {
          mutateLocalOptions.onSettled(
            data,
            null,
            variables,
            context as TContext
          );
        }

        return data;
      } catch (err) {
        const error = err as TError;
        dispatch({ type: "ERROR", error });

        // onError 콜백 (둘 다 실행: 훅 → mutate 옵션)
        if (latestOptions.current.onError) {
          await latestOptions.current.onError(
            error,
            variables,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onError) {
          mutateLocalOptions.onError(error, variables, context as TContext);
        }

        // onSettled 콜백 (둘 다 실행: 훅 → mutate 옵션)
        if (latestOptions.current.onSettled) {
          await latestOptions.current.onSettled(
            undefined,
            error,
            variables,
            context as TContext
          );
        }
        if (mutateLocalOptions?.onSettled) {
          mutateLocalOptions.onSettled(
            undefined,
            error,
            variables,
            context as TContext
          );
        }

        throw error;
      }
    },
    [queryClient]
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
      // mutateAsync에서 에러를 처리하므로, 여기서는 특별한 처리를 하지 않음 (콘솔 경고 등은 가능)
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
