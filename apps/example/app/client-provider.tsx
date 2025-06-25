"use client";

import { QueryClientProvider } from "./lib/query-client";
import { setDefaultQueryClientOptions } from "next-unified-query";
import { setupAllInterceptors } from "./register-interceptors";

// 서버와 클라이언트 모두에서 QueryClient 설정
setDefaultQueryClientOptions({
  baseURL: "http://localhost:3001",
  queryCache: {
    maxQueries: 1000,
  },
  setupInterceptors: setupAllInterceptors, // 복원
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider>{children}</QueryClientProvider>;
}
