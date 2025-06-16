// This file does NOT have "use client"
import {
  getQueryClient,
  createQueryClientWithInterceptors,
  type QueryClientOptionsWithInterceptors,
} from "next-type-fetch";
import {
  registerInterceptors,
  registerInterceptors2,
} from "../register-interceptors";

// 1. 공통 QueryClient 옵션 정의
export const commonQueryClientOptions: QueryClientOptionsWithInterceptors = {
  baseURL: "http://localhost:3001",
  queryCache: {
    maxQueries: 1000, // quick-lru를 사용한 캐시 크기 제한
  },
  setupInterceptors: (fetcher) => {
    registerInterceptors(fetcher);
    registerInterceptors2(fetcher);
  },
};

// 2. 환경 안전한 QueryClient 관리
// 서버에서는 새 인스턴스, 클라이언트에서는 싱글톤 자동 처리
export function getQueryClientInstance() {
  return getQueryClient(commonQueryClientOptions);
}

// 3. 기존 호환성을 위한 export (deprecated)
export const queryClient = getQueryClientInstance();
