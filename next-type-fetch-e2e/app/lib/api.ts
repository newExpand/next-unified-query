// This file does NOT have "use client"
import { QueryClient, createFetch } from "next-type-fetch";
import {
  registerInterceptors,
  registerInterceptors2,
} from "../register-interceptors";

// 1. 중앙 Fetcher 인스턴스 생성 및 설정
const fetcher = createFetch({
  baseURL: "http://localhost:3001",
});

// 2. Fetcher에 직접 인터셉터 등록
registerInterceptors(fetcher);
registerInterceptors2(fetcher);

// 3. 중앙 QueryClient 인스턴스 생성 (설정된 fetcher 주입)
const queryClient = new QueryClient({
  fetcher,
});

// 4. 중앙 인스턴스 export (다른 파일에서 사용하기 위함)
export { queryClient, fetcher };
