import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  QueryClient,
  ssrPrefetch,
  createQueryFactory,
  resetQueryClient,
  setDefaultQueryClientOptions,
} from "../src/index";
import { HydrationBoundary, QueryClientProvider, useQuery } from "../src/react";

const USER_DATA = { name: "SSRUser", id: 1 };
const ME_DATA = { name: "CurrentUser" };
const POSTS_DATA = [
  { id: 1, title: "Post 1" },
  { id: 2, title: "Post 2" },
];

// 테스트용 쿼리 팩토리
const testQueries = createQueryFactory({
  me: {
    cacheKey: () => ["me"] as const,
    url: () => "/api/me",
  },
  user: {
    cacheKey: (params: { id: number }) => ["user", params.id] as const,
    url: (params: { id: number }) => `/api/user/${params.id}`,
  },
  posts: {
    cacheKey: () => ["posts"] as const,
    url: () => "/api/posts",
    select: (data: any[]) => data.map((post) => ({ ...post, processed: true })),
  },
});

const mockFetchResponse = (data: any) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => data,
  text: async () => JSON.stringify(data),
  data, // NextTypeFetch response format
});

describe("SSR Prefetch + Hydration 통합 테스트", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resetQueryClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("기본 SSR Prefetch + Hydration", () => {
    it("params 없는 쿼리: SSR prefetch → hydrate → useQuery (새 API)", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(ME_DATA));

      // SSR: prefetch - 새로운 간단한 API 사용
      const dehydratedState = await ssrPrefetch([[testQueries.me]]);
      expect(fetchMock).toHaveBeenCalledWith("/api/me", expect.any(Object));

      // Client: hydrate + useQuery
      const queryClient = new QueryClient();
      const { result } = renderHook(() => useQuery(testQueries.me, {}), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
              {children}
            </HydrationBoundary>
          </QueryClientProvider>
        ),
      });

      // SSR에서 prefetch된 데이터가 즉시 사용됨
      expect(result.current.data).toEqual(ME_DATA);
      expect(result.current.isLoading).toBe(false);
    });

    it("params 있는 쿼리: SSR prefetch → hydrate → useQuery", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(USER_DATA));

      // SSR: prefetch
      const dehydratedState = await ssrPrefetch([
        [testQueries.user, { id: 1 }],
      ]);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/1?id=1",
        expect.any(Object)
      );

      // Client: hydrate + useQuery
      const queryClient = new QueryClient();
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

      expect(result.current.data).toEqual(USER_DATA);
      expect(result.current.isLoading).toBe(false);
    });

    it("select 함수가 있는 쿼리: SSR에서 select 적용됨", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(POSTS_DATA));

      const dehydratedState = await ssrPrefetch([[testQueries.posts]]);

      const queryClient = new QueryClient();
      const { result } = renderHook(() => useQuery(testQueries.posts, {}), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
              {children}
            </HydrationBoundary>
          </QueryClientProvider>
        ),
      });

      // Factory의 select 함수가 SSR에서 적용됨
      expect(result.current.data).toEqual([
        { id: 1, title: "Post 1", processed: true },
        { id: 2, title: "Post 2", processed: true },
      ]);
    });
  });

  describe("새로운 간단한 API 테스트", () => {
    it("파라미터 없는 쿼리: [query] 형태만 사용", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(ME_DATA));

      // 새로운 API: 파라미터가 없는 경우 undefined 생략
      const dehydratedState = await ssrPrefetch([[testQueries.me]]);

      expect(fetchMock).toHaveBeenCalledWith("/api/me", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // 데이터가 올바르게 캐시되었는지 확인
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["me"]));
    });

    it("파라미터 있는 쿼리: [query, params] 형태 사용", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(USER_DATA));

      // 파라미터가 있는 경우는 기존과 동일
      const dehydratedState = await ssrPrefetch([
        [testQueries.user, { id: 1 }],
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/1?id=1",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // 데이터가 올바르게 캐시되었는지 확인
      expect(Object.keys(dehydratedState)).toContain(
        JSON.stringify(["user", 1])
      );
    });

    it("혼합 사용: 파라미터 있는 것과 없는 것을 함께 사용", async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse(ME_DATA))
        .mockResolvedValueOnce(mockFetchResponse(USER_DATA))
        .mockResolvedValueOnce(mockFetchResponse(POSTS_DATA));

      // 새로운 API로 혼합 사용
      const dehydratedState = await ssrPrefetch([
        [testQueries.me], // 파라미터 없음 - 간단한 형태
        [testQueries.user, { id: 1 }], // 파라미터 있음
        [testQueries.posts], // 파라미터 없음 - 간단한 형태
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        "/api/me",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/user/1?id=1",
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "/api/posts",
        expect.any(Object)
      );

      // 모든 쿼리가 캐시되었는지 확인
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["me"]));
      expect(Object.keys(dehydratedState)).toContain(
        JSON.stringify(["user", 1])
      );
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["posts"]));
    });

    it("깔끔한 API: 불필요한 undefined 없이 사용", async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse(ME_DATA))
        .mockResolvedValueOnce(mockFetchResponse(POSTS_DATA));

      // 모든 파라미터 없는 쿼리를 깔끔하게 표현
      const dehydratedState = await ssrPrefetch([
        [testQueries.me],
        [testQueries.posts],
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      // 두 쿼리 모두 성공적으로 prefetch됨
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["me"]));
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["posts"]));
    });
  });

  describe("여러 쿼리 동시 Prefetch", () => {
    it("여러 쿼리를 동시에 prefetch하고 개별적으로 hydrate됨", async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse(ME_DATA))
        .mockResolvedValueOnce(mockFetchResponse(USER_DATA))
        .mockResolvedValueOnce(mockFetchResponse(POSTS_DATA));

      // 여러 쿼리 동시 prefetch
      const dehydratedState = await ssrPrefetch([
        [testQueries.me],
        [testQueries.user, { id: 1 }],
        [testQueries.posts],
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(3);

      // 각 쿼리가 독립적으로 동작하는지 확인
      const queryClient = new QueryClient();

      const { result: meResult } = renderHook(
        () => useQuery(testQueries.me, {}),
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

      const { result: userResult } = renderHook(
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

      expect(meResult.current.data).toEqual(ME_DATA);
      expect(userResult.current.data).toEqual(USER_DATA);
    });
  });

  describe("fetchConfig 처리", () => {
    it("baseURL이 URL 조합에 올바르게 적용됨", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(ME_DATA));

      const globalConfig = {
        baseURL: "https://api.example.com",
        headers: { "X-API-Key": "test-key" },
      };

      await ssrPrefetch([[testQueries.me]], globalConfig);

      // baseURL이 적용되어 전체 URL이 변경됨
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/me",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-API-Key": "test-key",
          }),
        })
      );
    });

    it("헤더 병합이 올바르게 동작함", async () => {
      // Factory에 fetchConfig가 있는 쿼리 생성
      const queryWithConfig = createQueryFactory({
        special: {
          cacheKey: () => ["special"] as const,
          url: () => "/api/special",
          fetchConfig: {
            headers: { "Content-Type": "application/json" },
          },
        },
      });

      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: "special" }));

      const globalConfig = {
        headers: { Authorization: "Bearer token" },
      };

      await ssrPrefetch([[queryWithConfig.special]], globalConfig);

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/special",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token",
          }),
        })
      );
    });

    it("timeout과 retry는 내부 로직으로 처리되어 RequestInit에 포함되지 않음", async () => {
      const queryWithAdvancedConfig = createQueryFactory({
        advanced: {
          cacheKey: () => ["advanced"] as const,
          url: () => "/api/advanced",
          fetchConfig: {
            timeout: 5000,
            retry: 3,
            headers: { "X-Custom": "value" },
          },
        },
      });

      fetchMock.mockResolvedValueOnce(mockFetchResponse({ data: "advanced" }));

      await ssrPrefetch([[queryWithAdvancedConfig.advanced]]);

      const [url, requestInit] = fetchMock.mock.calls[0];

      // timeout과 retry는 RequestInit에 포함되지 않음 (내부 로직으로 처리)
      expect(requestInit).not.toHaveProperty("timeout");
      expect(requestInit).not.toHaveProperty("retry");

      // 하지만 헤더는 포함됨
      expect(requestInit.headers).toEqual(
        expect.objectContaining({
          "X-Custom": "value",
        })
      );

      // 기본 fetch API 속성들은 포함됨
      expect(requestInit).toHaveProperty("method");
      expect(requestInit).toHaveProperty("headers");
      expect(requestInit).toHaveProperty("signal");
    });
  });

  describe("인터셉터와 SSR 통합", () => {
    it("인터셉터가 SSR prefetch에도 적용됨", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(USER_DATA));

      const logs: string[] = [];
      const queryClient = new QueryClient();

      // 인터셉터 설정
      queryClient.getFetcher().interceptors.request.use((config: any) => {
        config.headers = { ...config.headers, "X-SSR": "true" };
        logs.push("ssr-interceptor");
        return config;
      });

      await ssrPrefetch([[testQueries.user, { id: 1 }]], {}, queryClient);

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/1?id=1",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-SSR": "true" }),
        })
      );
      expect(logs).toContain("ssr-interceptor");
    });
  });

  describe("에러 처리 및 고급 기능", () => {
    it("개별 쿼리 실패 시 전체 prefetch가 중단되지 않음", async () => {
      fetchMock
        .mockResolvedValueOnce(mockFetchResponse(ME_DATA)) // 성공
        .mockRejectedValueOnce(new Error("Network error")) // 실패
        .mockResolvedValueOnce(mockFetchResponse(POSTS_DATA)); // 성공

      const dehydratedState = await ssrPrefetch([
        [testQueries.me],
        [testQueries.user, { id: 1 }], // 이것이 실패
        [testQueries.posts],
      ]);

      // 성공한 쿼리들은 dehydrated state에 포함됨
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["me"]));
      expect(Object.keys(dehydratedState)).toContain(JSON.stringify(["posts"]));

      // 실패한 쿼리는 포함되지 않음 (또는 이전 상태 유지)
      // Note: 에러 로깅 방식이 변경되어 콘솔 에러 로그 확인을 제거
    });

    it("retry 기능이 실제로 동작함", async () => {
      const queryWithRetry = createQueryFactory({
        unstable: {
          cacheKey: () => ["unstable"] as const,
          url: () => "/api/unstable",
          fetchConfig: {
            retry: 2, // 2회 재시도
          },
        },
      });

      // 첫 2번은 실패, 3번째는 성공
      fetchMock
        .mockRejectedValueOnce(new Error("Network error 1"))
        .mockRejectedValueOnce(new Error("Network error 2"))
        .mockResolvedValueOnce(
          mockFetchResponse({ data: "success after retry" })
        );

      const dehydratedState = await ssrPrefetch([[queryWithRetry.unstable]]);

      // 재시도 후 성공한 데이터가 포함되어야 함
      expect(Object.keys(dehydratedState)).toContain(
        JSON.stringify(["unstable"])
      );

      // 총 3번 호출되었는지 확인 (원래 1회 + 재시도 2회)
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("timeout 기능이 실제로 동작함", async () => {
      const queryWithTimeout = createQueryFactory({
        slow: {
          cacheKey: () => ["slow"] as const,
          url: () => "/api/slow",
          fetchConfig: {
            timeout: 100, // 100ms 타임아웃
          },
        },
      });

      // 타임아웃보다 오래 걸리는 응답 모킹
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockFetchResponse({ data: "too late" }));
            }, 200); // 200ms 지연
          })
      );

      const dehydratedState = await ssrPrefetch([[queryWithTimeout.slow]]);

      // 타임아웃으로 실패했으므로 dehydrated state에 포함되지 않음
      expect(Object.keys(dehydratedState)).not.toContain(
        JSON.stringify(["slow"])
      );

      // 에러 로그가 출력되었는지 확인
      // Note: 에러 로깅 방식이 변경되어 콘솔 에러 로그 확인을 제거
    });
  });

  describe("HydrationBoundary 동작", () => {
    it("HydrationBoundary는 한 번만 hydration 수행", () => {
      const queryClient = new QueryClient();
      const hydrateSpy = vi.spyOn(queryClient, "hydrate");

      const testState = {
        [JSON.stringify(["test"])]: {
          data: "test",
          isLoading: false,
          isFetching: false,
          updatedAt: Date.now(),
        },
      };

      const { rerender } = renderHook(() => null, {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={testState}>{children}</HydrationBoundary>
          </QueryClientProvider>
        ),
      });

      expect(hydrateSpy).toHaveBeenCalledTimes(1);

      // rerender해도 hydration은 한 번만 실행됨
      rerender();
      expect(hydrateSpy).toHaveBeenCalledTimes(1);
    });

    it("state가 없으면 hydration 하지 않음", () => {
      const queryClient = new QueryClient();
      const hydrateSpy = vi.spyOn(queryClient, "hydrate");

      renderHook(() => null, {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary>{children}</HydrationBoundary>
          </QueryClientProvider>
        ),
      });

      expect(hydrateSpy).not.toHaveBeenCalled();
    });
  });

  describe("QueryClient 환경별 관리", () => {
    it("client 파라미터가 없으면 자동으로 getQueryClient 사용", async () => {
      // 기본 옵션 설정
      setDefaultQueryClientOptions({
        baseURL: "https://auto.api.com",
      });

      fetchMock.mockResolvedValueOnce(mockFetchResponse(ME_DATA));

      await ssrPrefetch([[testQueries.me]]);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://auto.api.com/api/me",
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it("명시적 client가 제공되면 해당 client 사용", async () => {
      const customClient = new QueryClient({
        baseURL: "https://custom.api.com",
      });
      fetchMock.mockResolvedValueOnce(mockFetchResponse(ME_DATA));

      await ssrPrefetch([[testQueries.me]], {}, customClient);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://custom.api.com/api/me",
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });
  });

  describe("dehydrate/hydrate 순환", () => {
    it("dehydrate → hydrate → dehydrate 순환이 정상 동작", async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(USER_DATA));

      // 1. SSR prefetch → dehydrate
      const originalState = await ssrPrefetch([[testQueries.user, { id: 1 }]]);

      // 2. 새로운 client에 hydrate
      const newClient = new QueryClient();
      newClient.hydrate(originalState);

      // 3. 다시 dehydrate
      const rehydratedState = newClient.dehydrate();

      // 4. 원본과 동일한지 확인
      expect(rehydratedState).toEqual(originalState);

      // 5. 데이터가 올바르게 복원되는지 확인
      const userState = newClient.get(["user", 1]);
      expect(userState?.data).toEqual(USER_DATA);
    });
  });
});
