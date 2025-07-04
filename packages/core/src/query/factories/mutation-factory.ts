import type { z, ZodType } from "zod/v4";
import { isFunction } from "es-toolkit/compat";
import type {
  FetchConfig,
  FetchError,
  HttpMethod,
  QueryKey,
  NextTypeFetch,
} from "../../types";

/**
 * Zod 스키마가 명확히 있을 때만 z.infer<T>를 사용, 아니면 Fallback
 */
export type InferIfZodSchema<T, Fallback> = [T] extends [ZodType]
  ? z.infer<T>
  : Fallback;

/**
 * 기본 Mutation 설정 (url + method 방식)
 */
interface BaseMutationConfig<
  TVariables = any,
  TData = any,
  TError = FetchError,
  TContext = unknown,
  RequestSchema extends ZodType = never,
  ResponseSchema extends ZodType = never
> {
  /**
   * Mutation을 식별하는 캐시 키입니다. (선택적)
   * Devtools 등에서 사용될 수 있습니다.
   */
  cacheKey?: QueryKey;

  /**
   * 요청 본문의 유효성 검사를 위한 Zod 스키마입니다. (선택적)
   */
  requestSchema?: RequestSchema;

  /**
   * 응답 데이터의 유효성 검사를 위한 Zod 스키마입니다. (선택적)
   * 이 스키마로 파싱된 데이터가 TData 타입이 됩니다.
   */
  responseSchema?: ResponseSchema;

  /**
   * Mutation 함수 실행 전 호출되는 콜백입니다. (선택적)
   * 컨텍스트를 반환하여 onSuccess, onError, onSettled에서 사용할 수 있습니다.
   */
  onMutate?: (
    variables: TVariables
  ) => Promise<TContext | void> | TContext | void;

  /**
   * Mutation 성공 시 호출되는 콜백입니다. (선택적)
   */
  onSuccess?: (
    data: InferIfZodSchema<ResponseSchema, TData>,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;

  /**
   * Mutation 실패 시 호출되는 콜백입니다. (선택적)
   */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;

  /**
   * Mutation 성공 또는 실패 여부와 관계없이 항상 호출되는 콜백입니다. (선택적)
   */
  onSettled?: (
    data: InferIfZodSchema<ResponseSchema, TData> | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void;

  /**
   * Mutation 성공 시 무효화할 쿼리 키 목록 또는 동적으로 키 목록을 반환하는 함수입니다. (선택적)
   */
  invalidateQueries?:
    | QueryKey[]
    | ((
        data: InferIfZodSchema<ResponseSchema, TData>,
        variables: TVariables,
        context: TContext | undefined
      ) => QueryKey[]);

  /**
   * 이 Mutation에만 적용될 특정 fetch 설정을 지정합니다. (선택적)
   * baseURL, timeout, headers 등이 포함될 수 있습니다.
   */
  fetchConfig?: Omit<
    FetchConfig,
    "url" | "method" | "params" | "data" | "schema"
  >;
}

/**
 * URL + Method 기반 Mutation 설정
 */
interface UrlBasedMutationConfig<
  TVariables = any,
  TData = any,
  TError = FetchError,
  TContext = unknown,
  RequestSchema extends ZodType = never,
  ResponseSchema extends ZodType = never
> extends BaseMutationConfig<
    TVariables,
    TData,
    TError,
    TContext,
    RequestSchema,
    ResponseSchema
  > {
  /**
   * API 요청 URL을 생성하는 함수 또는 문자열입니다.
   * TVariables를 인자로 받아 URL 문자열을 반환합니다.
   */
  url: string | ((variables: TVariables) => string);

  /**
   * HTTP 요청 메서드입니다. (예: "POST", "PUT", "DELETE")
   */
  method: HttpMethod;

  /**
   * mutationFn이 있으면 안됨
   */
  mutationFn?: never;
}

/**
 * Custom Function 기반 Mutation 설정
 */
interface FunctionBasedMutationConfig<
  TVariables = any,
  TData = any,
  TError = FetchError,
  TContext = unknown,
  RequestSchema extends ZodType = never,
  ResponseSchema extends ZodType = never
> extends BaseMutationConfig<
    TVariables,
    TData,
    TError,
    TContext,
    RequestSchema,
    ResponseSchema
  > {
  /**
   * 사용자 정의 mutation 함수입니다.
   * variables와 fetcher를 인자로 받아 복잡한 로직을 처리할 수 있습니다.
   */
  mutationFn: (
    variables: TVariables,
    fetcher: NextTypeFetch
  ) => Promise<InferIfZodSchema<ResponseSchema, TData>>;

  /**
   * url/method가 있으면 안됨
   */
  url?: never;
  method?: never;
}

/**
 * Mutation을 정의하기 위한 설정 객체 인터페이스입니다.
 * URL + Method 방식 또는 Custom Function 방식 중 하나를 선택할 수 있습니다.
 */
export type MutationConfig<
  TVariables = any,
  TData = any,
  TError = FetchError,
  TContext = unknown,
  RequestSchema extends ZodType = never,
  ResponseSchema extends ZodType = never
> =
  | UrlBasedMutationConfig<
      TVariables,
      TData,
      TError,
      TContext,
      RequestSchema,
      ResponseSchema
    >
  | FunctionBasedMutationConfig<
      TVariables,
      TData,
      TError,
      TContext,
      RequestSchema,
      ResponseSchema
    >;

/**
 * MutationFactory에 전달될 입력 타입입니다.
 * 각 키는 특정 mutation을 나타내며, 값은 해당 mutation의 MutationConfig입니다.
 */
export type MutationFactoryInput = Record<
  string,
  MutationConfig<any, any, any, any, any, any>
>;

/**
 * MutationConfig에서 TVariables 타입을 추출합니다.
 */
export type ExtractMutationVariables<T> = T extends MutationConfig<
  infer V,
  any,
  any,
  any,
  any,
  any
>
  ? V
  : never;

/**
 * MutationConfig에서 TData 타입을 추출합니다.
 * responseSchema가 있으면 해당 스키마의 추론 타입을, 없으면 TData를 사용합니다.
 */
export type ExtractMutationData<T> = T extends MutationConfig<
  any,
  infer D,
  any,
  any,
  any,
  infer RS
>
  ? [RS] extends [ZodType]
    ? z.infer<RS>
    : D
  : never;

/**
 * MutationConfig에서 TError 타입을 추출합니다.
 */
export type ExtractMutationError<T> = T extends MutationConfig<
  any,
  any,
  infer E,
  any,
  any,
  any
>
  ? E
  : FetchError;

/**
 * 에러 메시지 상수
 */
const ERROR_MESSAGES = {
  BOTH_APPROACHES:
    "MutationConfig cannot have both 'mutationFn' and 'url'+'method' at the same time. " +
    "Choose either custom function approach (mutationFn) or URL-based approach (url + method).",
  MISSING_APPROACHES:
    "MutationConfig must have either 'mutationFn' or both 'url' and 'method'. " +
    "Provide either a custom function or URL-based configuration.",
} as const;

/**
 * Mutation 설정의 유효성을 검증
 */
export function validateMutationConfig(
  config: MutationConfig<any, any, any, any, any, any>
): void {
  // 프로덕션 환경에서는 검증 생략 (성능 최적화)
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const hasMutationFn = isFunction(config.mutationFn);
  const hasUrlMethod = config.url && config.method;

  if (hasMutationFn && hasUrlMethod) {
    throw new Error(ERROR_MESSAGES.BOTH_APPROACHES);
  }

  if (!hasMutationFn && !hasUrlMethod) {
    throw new Error(ERROR_MESSAGES.MISSING_APPROACHES);
  }
}

/**
 * Mutation 정의 객체를 받아 그대로 반환하는 팩토리 함수입니다.
 * 타입 추론을 돕고, 중앙에서 mutation들을 관리할 수 있게 합니다.
 * @param defs Mutation 정의 객체
 * @returns 전달된 Mutation 정의 객체
 */
export function createMutationFactory<T extends MutationFactoryInput>(
  defs: T
): T {
  // 각 MutationConfig 검증
  Object.entries(defs).forEach(([key, config]) => {
    try {
      validateMutationConfig(config);
    } catch (error) {
      throw new Error(
        `Invalid MutationConfig for '${key}': ${(error as Error).message}`
      );
    }
  });

  return defs;
}
