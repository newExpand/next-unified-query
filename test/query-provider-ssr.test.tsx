import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "../src/query/query-client";
import { ssrPrefetch } from "../src/query/ssr-prefetch";
import {
  HydrationBoundary,
  QueryClientProvider,
} from "../src/query/query-client-provider";
import { useQuery } from "../src/query/use-query";
import { createQueryFactory } from "../src/query/query-factory";

const USER_DATA = { name: "SSRUser" };

// 테스트용 쿼리 팩토리
const testQueries = createQueryFactory({
  user: {
    key: (params: { id: number }) => ["user", params.id],
    url: (params: { id: number }) => `/api/user/${params.id}`,
  },
});

describe("SSR prefetch + HydrationBoundary + useQuery 통합", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it("SSR prefetch 후 HydrationBoundary + useQuery로 데이터 사용", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => USER_DATA,
      text: async () => JSON.stringify(USER_DATA),
    });

    // SSR prefetch (서버에서 실행 가정)
    const queryClient = new QueryClient();
    await ssrPrefetch(queryClient, [[testQueries.user, { id: 1 }]]);
    const dehydratedState = queryClient.dehydrate();

    // 클라이언트에서 HydrationBoundary + useQuery로 데이터 확인
    const { result } = renderHook(() => useQuery(testQueries.user, { id: 1 }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        </QueryClientProvider>
      ),
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(USER_DATA);
    });
  });

  it("여러 인터셉터가 적용되는지 확인", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => USER_DATA,
      text: async () => JSON.stringify(USER_DATA),
    });

    const logs: string[] = [];
    const queryClient = new QueryClient();

    // 인터셉터 1: Authorization 헤더 추가
    queryClient.getFetcher().interceptors.request.use((config: any) => {
      config.headers = { ...config.headers, Authorization: "Bearer SSR" };
      logs.push("auth");
      return config;
    });
    // 인터셉터 2: 로그 기록
    queryClient.getFetcher().interceptors.request.use((config: any) => {
      logs.push("log");
      return config;
    });

    await ssrPrefetch(queryClient, [[testQueries.user, { id: 1 }]]);
    const dehydratedState = queryClient.dehydrate();

    const { result } = renderHook(() => useQuery(testQueries.user, { id: 1 }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(USER_DATA);
    });

    // fetchMock의 첫 번째 호출의 두 번째 인자(RequestInit)에서 헤더 확인
    const fetchConfig = fetchMock.mock.calls[0][1];
    expect(fetchConfig.headers["Authorization"]).toBe("Bearer SSR");
    expect(logs).toContain("auth");
    expect(logs).toContain("log");
  });
});
