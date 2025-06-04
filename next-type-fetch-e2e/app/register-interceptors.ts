import type { QueryClient } from "next-type-fetch";

/**
 * fetcher에 공통 인터셉터를 등록합니다.
 * SSR/CSR 모두에서 재사용 가능합니다.
 */
export function registerInterceptors(queryClient: QueryClient) {
  queryClient.getFetcher().interceptors.request.use((config) => {
    config.headers = { ...config.headers, "X-Test-Header": "test-value" };
    return config;
  });
}
