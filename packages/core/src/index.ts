export * from "./types/index";
export * from "./core/client";
export * from "./utils/response";
export * from "./utils/error";
export { interceptorTypes } from "./interceptors";

// 기본 fetch 인스턴스 - 고급/내부 사용 전용
export { default as defaultInstance } from "./fetch";

// Query 관련 팩토리 함수들 (사용자 API)
export {
  createQueryFactory,
  validateQueryConfig, // @internal
} from "./query/factories/query-factory";
export {
  createMutationFactory,
  validateMutationConfig, // @internal
} from "./query/factories/mutation-factory";
export type {
  QueryConfig,
  ExtractParams,
  ExtractQueryData,
} from "./query/factories/query-factory";
export type {
  MutationConfig,
  ExtractMutationVariables,
  ExtractMutationData,
  ExtractMutationError,
  InferIfZodSchema,
} from "./query/factories/mutation-factory";

// QueryClient 관리 - 환경 안전한 방식만 제공
export {
  getQueryClient,
  createQueryClientWithInterceptors,
  resetQueryClient,
  setDefaultQueryClientOptions,
  type InterceptorSetupFunction,
  type QueryClientOptionsWithInterceptors,
} from "./query/client/query-client-manager";

// QueryClient 클래스와 타입
export { QueryClient } from "./query/client/query-client";

// 타입 정의
export type { QueryCacheOptions, QueryState } from "./query/cache/query-cache";

// Query Observer 관련 - 고급 사용자 전용
export { QueryObserver } from "./query/observer/query-observer";
export type {
  QueryObserverOptions,
  QueryObserverResult,
} from "./query/observer/types";

// SSR 지원
export { ssrPrefetch } from "./query/ssr/ssr-prefetch";

// Zod re-export for unified access - named exports for tree-shaking
export { z, type ZodType, type ZodSchema } from "zod/v4";
export type { $ZodError, $ZodIssue } from "zod/v4/core";

// 레거시 지원 - 기존 코드 호환성을 위해 유지
export {
  request,
  get,
  post,
  put,
  del,
  patch,
  head,
  options,
  ntFetch,
  interceptors,
} from "./fetch";
