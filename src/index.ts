export * from "./types/index.js";
export * from "./core/client.js";
export * from "./utils/response.js";
export * from "./utils/error.js";
export { interceptorTypes } from "./interceptors.js";

// 기본 fetch 인스턴스 - 직접 fetch 사용이 필요한 경우
export { default as defaultInstance } from "./fetch.js";

// Query 관련 팩토리 함수들
export { createQueryFactory } from "./query/query-factory.js";
export { createMutationFactory } from "./query/mutation-factory.js";

// QueryClient 관리 - 환경 안전한 방식만 제공
export {
  getQueryClient,
  createQueryClientWithInterceptors,
  resetQueryClient,
  setDefaultQueryClientOptions,
  type InterceptorSetupFunction,
  type QueryClientOptionsWithInterceptors,
} from "./query/query-client-manager.js";

// 타입 정의
export type { QueryCacheOptions } from "./query/query-cache.js";

// SSR 지원
export { ssrPrefetch } from "./query/ssr-prefetch.js";

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
} from "./fetch.js";
