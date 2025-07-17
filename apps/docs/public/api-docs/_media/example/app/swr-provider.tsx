"use client";

import { SWRConfig } from "swr";
import { commonFetcher, COMMON_CACHE_CONFIG } from "./benchmark/shared-config";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        fetcher: commonFetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: COMMON_CACHE_CONFIG.staleTime, // 다른 라이브러리와 동일한 캐시 시간
        errorRetryCount: 3,
        errorRetryInterval: 1000,
      }}
    >
      {children}
    </SWRConfig>
  );
}