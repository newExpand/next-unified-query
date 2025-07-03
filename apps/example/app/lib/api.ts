// This file does NOT have "use client"
import {
  createQueryClientWithInterceptors,
  type QueryClientOptionsWithInterceptors,
} from "next-unified-query";
import {
  registerInterceptors,
  registerInterceptors2,
} from "../register-interceptors";

// 1. createQueryClientWithInterceptors 방식으로 QueryClient 생성
export const queryClient = createQueryClientWithInterceptors(
  {
    baseURL: "http://localhost:3001",
    timeout: 30000, // 30초 기본 타임아웃 설정
    queryCache: {
      maxQueries: 1000, // quick-lru를 사용한 캐시 크기 제한
    },
  },
  (fetcher) => {
    registerInterceptors(fetcher);
    registerInterceptors2(fetcher);
  }
);

// 2. 함수형 접근을 위한 getter (선택사항)
export function getQueryClientInstance() {
  return queryClient;
}
