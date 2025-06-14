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

/**
 * 모든 인터셉터를 한 번에 설정하는 공통 함수
 * 서버사이드와 클라이언트사이드에서 동일하게 사용됩니다.
 */
export function setupAllInterceptors(fetcher: NextTypeFetch) {
  registerInterceptors(fetcher);
  registerInterceptors2(fetcher);
}
