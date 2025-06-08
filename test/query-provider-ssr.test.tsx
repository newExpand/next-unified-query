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
const ME_DATA = { name: "Me" };

// params 없는 쿼리와 params 필요한 쿼리 모두 포함치
const testQueries = createQueryFactory({
  me: {
    key: () => ["me"],
    url: () => "/api/me",
  },
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

  it("params 없는 쿼리도 SSR prefetch + HydrationBoundary + useQuery로 동작", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ME_DATA,
      text: async () => JSON.stringify(ME_DATA),
    });

    const queryClient = new QueryClient();
    await ssrPrefetch(queryClient, [[testQueries.me, undefined]]);
    const dehydratedState = queryClient.dehydrate();

    const { result } = renderHook(() => useQuery(testQueries.me), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        </QueryClientProvider>
      ),
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(ME_DATA);
    });
  });

  it("params가 필요한 쿼리: SSR prefetch 후 HydrationBoundary + useQuery로 데이터 사용", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => USER_DATA,
      text: async () => JSON.stringify(USER_DATA),
    });

    const queryClient = new QueryClient();
    await ssrPrefetch(queryClient, [[testQueries.user, { id: 1 }]]);
    const dehydratedState = queryClient.dehydrate();

    const { result } = renderHook(
      () => useQuery(testQueries.user, { params: { id: 1 } }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
              {children}
            </HydrationBoundary>
          </QueryClientProvider>
        ),
      }
    );
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

    const { result } = renderHook(
      () => useQuery(testQueries.user, { params: { id: 1 } }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
              {children}
            </HydrationBoundary>
          </QueryClientProvider>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(USER_DATA);
    });

    expect(logs).toContain("auth");
    expect(logs).toContain("log");
  });
});
