import type { NextTypeFetch } from "next-type-fetch";

/**
 * fetcher에 공통 인터셉터를 등록합니다.
 * SSR/CSR 모두에서 재사용 가능합니다.
 */
export function registerInterceptors(fetcher: NextTypeFetch) {
  fetcher.interceptors.request.use((config) => {
    config.headers = { ...config.headers, "X-Test-Header": "test-value" };
    return config;
  });
}

export function registerInterceptors2(fetcher: NextTypeFetch) {
  fetcher.interceptors.request.use((config) => {
    config.headers = { ...config.headers, "X-Custom-Header": "custom-value" };
    return config;
  });
}
