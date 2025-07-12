import type { z, ZodType } from "zod/v4";
import { isString, isFunction } from "es-toolkit/compat";
import { FetchConfig, QueryFetcher } from "../../types";

/**
 * Zod 스키마가 명확히 있을 때만 z.infer<T>를 사용, 아니면 Fallback
 */
type InferIfZodSchema<T, Fallback> = [T] extends [ZodType]
  ? z.infer<T>
  : Fallback;

/**
 * 기본 Query 설정 (공통 속성)
 */
interface BaseQueryConfig<Params = void, Schema extends ZodType = ZodType> {
  cacheKey: (params?: Params) => readonly unknown[];
  schema?: Schema;
  placeholderData?:
    | any
    | ((
        prev?: any,
        prevQuery?: import("../cache/query-cache").QueryState<any>
      ) => any);
  fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
  select?: (data: any) => any;
  selectDeps?: any[];
  enabled?: boolean | ((params?: Params) => boolean);
}

/**
 * URL 기반 Query 설정
 */
interface UrlBasedQueryConfig<Params = void, Schema extends ZodType = ZodType>
  extends BaseQueryConfig<Params, Schema> {
  /**
   * API 요청 URL을 생성하는 함수
   */
  url: (params?: Params) => string;

  /**
   * queryFn이 있으면 안됨 (상호 배제)
   */
  queryFn?: never;
}

/**
 * Custom Function 기반 Query 설정
 */
interface FunctionBasedQueryConfig<
  Params = void,
  Schema extends ZodType = ZodType
> extends BaseQueryConfig<Params, Schema> {
  /**
   * 복잡한 요청을 위한 커스텀 쿼리 함수
   * 복잡한 요청을 처리할 수 있는 사용자 정의 함수
   * Factory 방식에서는 QueryFetcher를 사용 (GET/HEAD 메서드만 허용)
   */
  queryFn: (params: Params, fetcher: QueryFetcher) => Promise<any>;

  /**
   * url이 있으면 안됨 (상호 배제)
   */
  url?: never;
}

/**
 * Query를 정의하기 위한 설정 객체 인터페이스
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
export type QueryConfig<Params = void, Schema extends ZodType = ZodType> =
  | UrlBasedQueryConfig<Params, Schema>
  | FunctionBasedQueryConfig<Params, Schema>;

export type QueryFactoryInput = Record<string, QueryConfig<any, any>>;

export type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;

/**
 * QueryConfig에서 스키마 기반 데이터 타입을 추출합니다.
 * 스키마가 있으면 해당 스키마의 추론 타입을, 없으면 any를 사용합니다.
 */
export type ExtractQueryData<T> = T extends QueryConfig<any, infer S>
  ? InferIfZodSchema<S, any>
  : any;

/**
 * 에러 메시지 상수
 */
const ERROR_MESSAGES = {
  BOTH_APPROACHES:
    "QueryConfig cannot have both 'queryFn' and 'url' at the same time. " +
    "Choose either custom function approach (queryFn) or URL-based approach (url).",
  MISSING_APPROACHES:
    "QueryConfig must have either 'queryFn' or 'url'. " +
    "Provide either a custom function or URL-based configuration.",
} as const;

/**
 * Query 설정의 유효성을 검증합니다.
 * QueryConfig와 UseQueryOptions 모두 지원합니다.
 * 
 * @internal 이 함수는 내부적으로 사용되며, 직접 호출할 필요가 없습니다.
 * 대신 createQueryFactory나 useQuery를 사용하세요.
 */
export function validateQueryConfig(
  config: QueryConfig<any, any> | any // UseQueryOptions도 받을 수 있도록
): void {
  // 프로덕션 환경에서는 검증 생략 (성능 최적화)
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const hasQueryFn = isFunction(config.queryFn);
  const hasUrl = isFunction(config.url) || isString(config.url); // function 또는 string 둘 다 허용

  if (hasQueryFn && hasUrl) {
    throw new Error(ERROR_MESSAGES.BOTH_APPROACHES);
  }

  if (!hasQueryFn && !hasUrl) {
    throw new Error(ERROR_MESSAGES.MISSING_APPROACHES);
  }
}

/**
 * 타입 안전한 API 정의를 가진 쿼리 팩토리를 생성합니다.
 * 
 * **환경 호환성:**
 * - ✅ 서버사이드: Next.js 서버 컴포넌트와 API 루트에서 안전하게 사용 가능
 * - ✅ 클라이언트사이드: 브라우저 환경에서 동작
 * - ✅ SSR: 서버사이드 렌더링과 호환
 * 
 * @example
 * ```typescript
 * // 서버 또는 클라이언트 - 둘 다 동작
 * import { createQueryFactory } from 'next-unified-query';
 * 
 * const api = createQueryFactory({
 *   getUser: {
 *     cacheKey: (id: number) => ['user', id],
 *     url: (id: number) => `/users/${id}`,
 *     schema: z.object({ name: z.string(), email: z.string() })
 *   }
 * });
 * ```
 */
export function createQueryFactory<T extends QueryFactoryInput>(defs: T): T {
  // 각 QueryConfig 검증
  Object.entries(defs).forEach(([key, config]) => {
    try {
      validateQueryConfig(config);
    } catch (error) {
      throw new Error(
        `Invalid QueryConfig for '${key}': ${(error as Error).message}`
      );
    }
  });

  return defs;
}
