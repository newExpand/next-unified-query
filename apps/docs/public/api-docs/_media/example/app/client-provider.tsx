"use client";

import { QueryClientProvider } from "./lib/query-client";
import { setDefaultQueryClientOptions } from "next-unified-query";
import { setupAllInterceptors } from "./register-interceptors";

// 클라이언트에서도 동일한 옵션 사용 (중복 설정이지만 안전장치)
setDefaultQueryClientOptions({
  baseURL: "http://localhost:3001",
  timeout: 30000, // 30초 기본 타임아웃 설정
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors,
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
