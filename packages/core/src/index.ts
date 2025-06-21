export * from "./types/index";
export * from "./core/client";
export * from "./utils/response";
export * from "./utils/error";
export { interceptorTypes } from "./interceptors";

// 기본 fetch 인스턴스 - 직접 fetch 사용이 필요한 경우
export { default as defaultInstance } from "./fetch";

// Query 관련 팩토리 함수들
export { createQueryFactory, validateQueryConfig } from "./query/factories/query-factory";
export { createMutationFactory, validateMutationConfig } from "./query/factories/mutation-factory";
export type { QueryConfig, ExtractParams } from "./query/factories/query-factory";
export type { MutationConfig, ExtractMutationVariables, ExtractMutationData, ExtractMutationError } from "./query/factories/mutation-factory";

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

// Query Observer 관련
export { QueryObserver } from "./query/observer/query-observer";
export type { QueryObserverOptions, QueryObserverResult } from "./query/observer/types";

// SSR 지원
export { ssrPrefetch } from "./query/ssr/ssr-prefetch";

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