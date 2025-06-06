import type { z, ZodType } from "zod/v4";
import type { FetchConfig, HttpMethod, QueryKey } from "../types/index.js";

/**
 * Zod 스키마가 명확히 있을 때만 z.infer<T>를 사용, 아니면 Fallback
 */
type InferIfZodSchema<T, Fallback> = [T] extends [ZodType]
  ? z.infer<T>
  : Fallback;

/**
 * Mutation을 정의하기 위한 설정 객체 인터페이스입니다.
 * 이 설정을 기반으로 useMutation 훅에서 mutation 함수 등이 자동으로 구성될 수 있습니다.
 */
export interface MutationConfig<
  TVariables = any,
  TData = any,
  TError = Error,
  TContext = unknown,
  RequestSchema extends ZodType = never,
  ResponseSchema extends ZodType = never
> {
  /**
   * Mutation을 식별하는 키입니다. (선택적)
   * Devtools 등에서 사용될 수 있습니다.
   */
  mutationKey?: QueryKey;

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

  /**
   * 사용자가 직접 mutation 함수를 제공하고자 할 때 사용합니다. (선택적)
   * 이 함수가 정의되면 url, method, requestSchema, responseSchema, fetchConfig는 fetcher를 구성하는 데 사용되지 않을 수 있습니다.
   */
  mutationFn?: (
    variables: TVariables
  ) => Promise<InferIfZodSchema<ResponseSchema, TData>>;
}

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
  : Error;

/**
 * Mutation 정의 객체를 받아 그대로 반환하는 팩토리 함수입니다.
 * 타입 추론을 돕고, 중앙에서 mutation들을 관리할 수 있게 합니다.
 * @param defs Mutation 정의 객체
 * @returns 전달된 Mutation 정의 객체
 */
export function createMutationFactory<T extends MutationFactoryInput>(
  defs: T
): T {
  return defs;
}
