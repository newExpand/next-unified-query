import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "../src/query/hooks/use-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient } from "../src/query/client/query-client";
import { QueryClientProvider } from "../src/query/client/query-client-provider";
import { createQueryFactory } from "../src/query/factories/query-factory";

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const mockResponse = (data: any) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: new Headers(),
  config: {},
});

// Factory-based 테스트용 쿼리 팩토리
const userQueries = createQueryFactory({
  getUser: {
    cacheKey: (id: number) => ["user", id] as const,
    url: (id: number) => `/api/user/${id}`,
  },
  searchUsers: {
    cacheKey: (search: string) => ["users", "search", search] as const,
    url: (search: string) => `/api/users/search?q=${search}`,
    enabled: (search: string) => search.length > 2,
  },
});

describe("useQuery", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
    client.clear();
    vi.clearAllMocks();
  });

  describe("Options-based 사용법", () => {
    it("기본 GET 요청 성공", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice" })
      );

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 1],
            url: "/api/user/1",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ name: "Alice" });
      expect(result.current.error).toBeUndefined();
      expect(result.current.isSuccess).toBe(true);
    });

    it("에러 처리", async () => {
      vi.spyOn(client.getFetcher(), "get").mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(
        () => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });

    it("enabled=false 옵션 시 fetch 안함", async () => {
      const fetcherSpy = vi.spyOn(client.getFetcher(), "get");

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 1],
            url: "/api/user/1",
            enabled: false,
          }),
        { wrapper: createWrapper(client) }
      );

      expect(result.current.isLoading).toBe(false);
      expect(fetcherSpy).not.toHaveBeenCalled();
    });

    it("select 옵션으로 데이터 변환", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice", age: 20 })
      );

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 1],
            url: "/api/user/1",
            select: (data: any) => data.name,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data).toBe("Alice");
    });

    it("placeholderData: 값 사용 시 fetch 전 임시 데이터 노출", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice" })
      );

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 1],
            url: "/api/user/1",
            placeholderData: { name: "임시" },
          }),
        { wrapper: createWrapper(client) }
      );

      // fetch 전 placeholderData 노출
      expect(result.current.data).toEqual({ name: "임시" });
      expect(result.current.isPlaceholderData).toBe(true);

      await waitFor(() =>
        expect(result.current.data).toEqual({ name: "Alice" })
      );
      expect(result.current.isPlaceholderData).toBe(false);
    });

    it("placeholderData: 함수로 이전 데이터 유지", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "A" })
      );

      const { result: r1, rerender } = renderHook(
        ({ id }) =>
          useQuery({
            cacheKey: ["user", id],
            url: `/api/user/${id}`,
            placeholderData: (prev) => prev ?? { name: "로딩" },
          }),
        { initialProps: { id: 1 }, wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(r1.current.data).toEqual({ name: "A" }));

      // 쿼리키 변경(2) → fetch 전 이전 데이터 유지
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "B" })
      );
      rerender({ id: 2 });
      expect(r1.current.data).toEqual({ name: "A" }); // 이전 데이터 유지

      await waitFor(() => expect(r1.current.data).toEqual({ name: "B" }));
    });
  });

  describe("Factory-based 사용법", () => {
    it("파라미터가 있는 쿼리 팩토리 사용", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice", id: 1 })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUser, { params: 1 }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ name: "Alice", id: 1 });
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/user/1",
        expect.any(Object)
      );
    });

    it("조건부 enabled가 있는 쿼리 팩토리", async () => {
      // 짧은 검색어 (enabled=false)
      const fetcherSpy1 = vi.spyOn(client.getFetcher(), "get");
      const { result: r1 } = renderHook(
        () => useQuery(userQueries.searchUsers, { params: "ab" }),
        { wrapper: createWrapper(client) }
      );

      expect(r1.current.isLoading).toBe(false);
      expect(fetcherSpy1).not.toHaveBeenCalled();

      // 긴 검색어 (enabled=true) - 새로운 spy 생성
      fetcherSpy1.mockClear();
      fetcherSpy1.mockResolvedValueOnce(mockResponse([{ name: "Alice" }]));

      const { result: r2 } = renderHook(
        () => useQuery(userQueries.searchUsers, { params: "alice" }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(r2.current.isLoading).toBe(false);
      });

      expect(r2.current.data).toEqual([{ name: "Alice" }]);
      expect(fetcherSpy1).toHaveBeenCalledWith(
        "/api/users/search?q=alice",
        expect.any(Object)
      );
    });

    it("Factory 옵션 오버라이드", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice", id: 1 })
      );

      const { result } = renderHook(
        () =>
          useQuery(userQueries.getUser, {
            params: 1,
            select: (data: any) => data.name,
            staleTime: 5000,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe("Alice"); // select 적용됨
    });
  });

  describe("캐시 및 상태 관리", () => {
    it("쿼리키별 캐시 동작", async () => {
      vi.spyOn(client.getFetcher(), "get")
        .mockResolvedValueOnce(mockResponse({ name: "A" }))
        .mockResolvedValueOnce(mockResponse({ name: "B" }));

      const { result: r1 } = renderHook(
        () => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }),
        { wrapper: createWrapper(client) }
      );

      const { result: r2 } = renderHook(
        () => useQuery({ cacheKey: ["user", 2], url: "/api/user/2" }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(r1.current.isLoading).toBe(false);
        expect(r2.current.isLoading).toBe(false);
      });

      expect(r1.current.data).toEqual({ name: "A" });
      expect(r2.current.data).toEqual({ name: "B" });
    });

    it("refetch 동작", async () => {
      vi.spyOn(client.getFetcher(), "get")
        .mockResolvedValueOnce(mockResponse({ name: "A" }))
        .mockResolvedValueOnce(mockResponse({ name: "B" }));

      const { result } = renderHook(
        () => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => expect(result.current.data).toEqual({ name: "B" }));
      expect(client.getFetcher().get).toHaveBeenCalledTimes(2);
    });

    it("gcTime: 언마운트 후 가비지 컬렉션", async () => {
      vi.useRealTimers();
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "A" })
      );

      const { result, unmount } = renderHook(
        () =>
          useQuery({ cacheKey: ["user", 1], url: "/api/user/1", gcTime: 30 }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(client.get(["user", 1])?.data).toEqual({ name: "A" });

      unmount();

      await new Promise((r) => setTimeout(r, 20));
      expect(client.get(["user", 1])?.data).toEqual({ name: "A" });

      await new Promise((r) => setTimeout(r, 20));
      expect(client.get(["user", 1])?.data).toBeUndefined();
    }, 10000);

    it("staleTime: fresh 상태에서는 재마운트 시 fetch 생략", async () => {
      vi.useRealTimers();
      vi.spyOn(client.getFetcher(), "get").mockResolvedValue(
        mockResponse({ name: "A" })
      );

      const { unmount } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 10],
            url: "/api/user/10",
            staleTime: 50,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() =>
        expect(client.getFetcher().get).toHaveBeenCalledTimes(1)
      );

      act(() => {
        unmount();
      });

      // staleTime 내 재마운트: fetch 생략
      const { unmount: unmount2 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 10],
            url: "/api/user/10",
            staleTime: 50,
          }),
        { wrapper: createWrapper(client) }
      );
      expect(client.getFetcher().get).toHaveBeenCalledTimes(1);

      act(() => {
        unmount2();
      });

      // staleTime 경과 후 재마운트: fetch 발생
      await act(async () => {
        await new Promise((r) => setTimeout(r, 60));
      });

      renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 10],
            url: "/api/user/10",
            staleTime: 50,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() =>
        expect(client.getFetcher().get).toHaveBeenCalledTimes(2)
      );
    }, 10000);
  });

  describe("상태 관리", () => {
    it("isFetching 상태 변화", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice" })
      );

      const { result } = renderHook(
        () => useQuery({ cacheKey: ["user", 1], url: "/api/user/1" }),
        { wrapper: createWrapper(client) }
      );

      // fetch 시작 직후: isFetching true
      expect(result.current.isFetching).toBe(true);
      await waitFor(() => expect(result.current.isFetching).toBe(false));
    });

    it("isStale 상태: staleTime 경과 후 true", async () => {
      vi.useRealTimers();
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "A" })
      );

      const { result, unmount } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 20],
            url: "/api/user/20",
            staleTime: 30,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => expect(result.current.isStale).toBe(false));

      act(() => {
        unmount();
      });

      // staleTime 경과 대기
      await act(async () => {
        await new Promise((r) => setTimeout(r, 40));
      });

      // 새로운 hook으로 stale 상태 확인
      const { result: result2 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user", 20],
            url: "/api/user/20",
            staleTime: 30,
          }),
        { wrapper: createWrapper(client) }
      );

      // staleTime이 경과했으므로 isStale이 true여야 함
      await waitFor(() => expect(result2.current.isStale).toBe(true));
    }, 10000);
  });

  describe("queryFn Options-based 사용법", () => {
    it("queryFn으로 복잡한 요청 처리", async () => {
      const mockData = { combinedData: "success" };
      const queryFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["complex", "query"],
            queryFn,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.isSuccess).toBe(true);
      expect(queryFn).toHaveBeenCalledWith(client.getFetcher());
    });

    it("queryFn에서 여러 API 호출 조합", async () => {
      vi.spyOn(client.getFetcher(), "get")
        .mockResolvedValueOnce(mockResponse({ id: 1, name: "Alice" }))
        .mockResolvedValueOnce(mockResponse([{ id: 1, title: "Post 1" }]));

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user-posts", 1],
            queryFn: async (fetcher) => {
              const [userRes, postsRes] = await Promise.all([
                fetcher.get("/api/user/1"),
                fetcher.get("/api/user/1/posts"),
              ]);

              return {
                user: userRes.data,
                posts: postsRes.data,
              };
            },
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        user: { id: 1, name: "Alice" },
        posts: [{ id: 1, title: "Post 1" }],
      });

      expect(client.getFetcher().get).toHaveBeenCalledTimes(2);
      expect(client.getFetcher().get).toHaveBeenCalledWith("/api/user/1");
      expect(client.getFetcher().get).toHaveBeenCalledWith("/api/user/1/posts");
    });

    it("queryFn에서 에러 발생 시 처리", async () => {
      const queryError = new Error("QueryFn error");
      const queryFn = vi.fn().mockRejectedValue(queryError);

      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["error", "query"],
            queryFn,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(queryError);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("런타임 검증 - Options", () => {
    it("url과 queryFn 둘 다 제공하면 에러", () => {
      expect(() => {
        renderHook(
          () =>
            useQuery({
              cacheKey: ["test"],
              url: "/api/test",
              queryFn: async () => ({}),
            } as any),
          { wrapper: createWrapper(client) }
        );
      }).toThrow(
        "QueryConfig cannot have both 'queryFn' and 'url' at the same time"
      );
    });

    it("url과 queryFn 둘 다 없으면 에러", () => {
      expect(() => {
        renderHook(
          () =>
            useQuery({
              cacheKey: ["test"],
            } as any),
          { wrapper: createWrapper(client) }
        );
      }).toThrow("QueryConfig must have either 'queryFn' or 'url'");
    });

    it("올바른 url 옵션으로 성공", () => {
      expect(() => {
        renderHook(
          () =>
            useQuery({
              cacheKey: ["test"],
              url: "/api/test",
            }),
          { wrapper: createWrapper(client) }
        );
      }).not.toThrow();
    });

    it("올바른 queryFn 옵션으로 성공", () => {
      expect(() => {
        renderHook(
          () =>
            useQuery({
              cacheKey: ["test"],
              queryFn: async () => ({}),
            }),
          { wrapper: createWrapper(client) }
        );
      }).not.toThrow();
    });
  });

  describe("다중 캐시키 처리", () => {
    it("인자값으로 받는 케이스: 복합 캐시키 처리", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ name: "Alice", posts: [{ id: 1, title: "Post 1" }] })
      );

      // 복합 캐시키: 사용자 ID와 페이지 정보
      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: ["user-posts", 1, "page", 1],
            url: "/api/user/1/posts?page=1",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        name: "Alice",
        posts: [{ id: 1, title: "Post 1" }],
      });
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/user/1/posts?page=1",
        expect.any(Object)
      );

      // 캐시키가 올바르게 저장되었는지 확인
      const cached = client.get(["user-posts", 1, "page", 1]);
      expect(cached?.data).toEqual({
        name: "Alice",
        posts: [{ id: 1, title: "Post 1" }],
      });
    });

    it("인자값으로 받는 케이스: 검색 쿼리와 필터 조합", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse([
          { id: 1, name: "Alice", department: "Engineering" },
          { id: 2, name: "Alex", department: "Engineering" },
        ])
      );

      // 검색어 + 부서 필터 + 페이지 정보
      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: [
              "users",
              "search",
              "al",
              "department",
              "engineering",
              "page",
              1,
            ],
            url: "/api/users/search?q=al&department=engineering&page=1",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect((result.current.data as any)[0].name).toBe("Alice");
      expect((result.current.data as any)[1].name).toBe("Alex");

      // 복잡한 캐시키가 올바르게 처리되었는지 확인
      const cached = client.get([
        "users",
        "search",
        "al",
        "department",
        "engineering",
        "page",
        1,
      ]);
      expect(cached?.data).toHaveLength(2);
    });

    it("객체로 받는 케이스: 중첩된 객체 캐시키", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ analytics: { views: 1000, clicks: 50 } })
      );

      // 중첩된 객체를 캐시키로 사용
      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: [
              "analytics",
              {
                userId: 1,
                dateRange: { start: "2024-01-01", end: "2024-01-31" },
                metrics: ["views", "clicks"],
              },
            ],
            url: "/api/analytics?userId=1&start=2024-01-01&end=2024-01-31&metrics=views,clicks",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        analytics: { views: 1000, clicks: 50 },
      });

      // 객체 캐시키가 올바르게 직렬화되어 저장되었는지 확인
      const cached = client.get([
        "analytics",
        {
          userId: 1,
          dateRange: { start: "2024-01-01", end: "2024-01-31" },
          metrics: ["views", "clicks"],
        },
      ]);
      expect(cached?.data).toEqual({
        analytics: { views: 1000, clicks: 50 },
      });
    });

    it("객체로 받는 케이스: 배열과 객체 혼합 캐시키", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({
          products: [
            { id: 1, name: "Product A", price: 100 },
            { id: 2, name: "Product B", price: 200 },
          ],
        })
      );

      // 배열과 객체가 혼합된 복잡한 캐시키
      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey: [
              "products",
              "filtered",
              {
                categories: ["electronics", "gadgets"],
                priceRange: { min: 50, max: 300 },
                sortBy: "price",
                order: "asc",
              },
              ["page", 1],
            ],
            url: "/api/products?categories=electronics,gadgets&minPrice=50&maxPrice=300&sortBy=price&order=asc&page=1",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect((result.current.data as any).products).toHaveLength(2);
      expect((result.current.data as any).products[0].name).toBe("Product A");

      // 복잡한 혼합 캐시키가 올바르게 처리되었는지 확인
      const cached = client.get([
        "products",
        "filtered",
        {
          categories: ["electronics", "gadgets"],
          priceRange: { min: 50, max: 300 },
          sortBy: "price",
          order: "asc",
        },
        ["page", 1],
      ]);
      expect((cached?.data as any).products).toHaveLength(2);
    });

    it("캐시키 변경 시 별도 캐시 생성", async () => {
      vi.spyOn(client.getFetcher(), "get")
        .mockResolvedValueOnce(
          mockResponse({ page: 1, data: ["item1", "item2"] })
        )
        .mockResolvedValueOnce(
          mockResponse({ page: 2, data: ["item3", "item4"] })
        );

      // 첫 번째 페이지
      const { result: r1 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["items", { page: 1, limit: 10 }],
            url: "/api/items?page=1&limit=10",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(r1.current.isLoading).toBe(false);
      });

      // 두 번째 페이지
      const { result: r2 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["items", { page: 2, limit: 10 }],
            url: "/api/items?page=2&limit=10",
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(r2.current.isLoading).toBe(false);
      });

      // 각각 다른 데이터를 가져야 함
      expect(r1.current.data).toEqual({ page: 1, data: ["item1", "item2"] });
      expect(r2.current.data).toEqual({ page: 2, data: ["item3", "item4"] });

      // 두 번의 fetch가 발생해야 함
      expect(client.getFetcher().get).toHaveBeenCalledTimes(2);

      // 각각 별도 캐시에 저장되어야 함
      const cache1 = client.get(["items", { page: 1, limit: 10 }]);
      const cache2 = client.get(["items", { page: 2, limit: 10 }]);

      expect((cache1?.data as any).page).toBe(1);
      expect((cache2?.data as any).page).toBe(2);
    });

    it("동일한 객체 구조의 캐시키는 같은 캐시 사용", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ shared: "data" })
      );

      // 첫 번째 useQuery
      const { result: r1 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["config", { env: "prod", version: "1.0" }],
            url: "/api/config?env=prod&version=1.0",
            staleTime: 10000,
          }),
        { wrapper: createWrapper(client) }
      );

      await waitFor(() => {
        expect(r1.current.isLoading).toBe(false);
      });

      // 동일한 구조의 객체로 두 번째 useQuery (새로운 객체 인스턴스)
      const { result: r2 } = renderHook(
        () =>
          useQuery({
            cacheKey: ["config", { env: "prod", version: "1.0" }], // 새로운 객체 인스턴스
            url: "/api/config?env=prod&version=1.0",
            staleTime: 10000,
          }),
        { wrapper: createWrapper(client) }
      );

      // 즉시 캐시된 데이터를 사용해야 함
      expect(r2.current.data).toEqual({ shared: "data" });
      expect(r2.current.isLoading).toBe(false);

      // fetch는 한 번만 발생해야 함 (캐시 재사용)
      expect(client.getFetcher().get).toHaveBeenCalledTimes(1);
    });
  });

  describe("Prefetch 및 Hydration", () => {
    it("prefetch 후 hydrate하면 useQuery에서 fetcher 호출 없이 캐시 사용", async () => {
      const keyA = ["user", 1];
      const keyB = ["user", 2];
      const dataA = { name: "Alice" };
      const dataB = { name: "Bob" };

      // prefetch로 미리 데이터 패치
      await client.prefetchQuery(keyA, async () => dataA);
      await client.prefetchQuery(keyB, async () => dataB);

      // 직렬화 후 클리어
      const dehydrated = client.dehydrate();
      client.clear();

      // 복원
      client.hydrate(dehydrated);

      // fetcher.get이 호출되지 않도록 mock
      const fetcherSpy = vi.spyOn(client.getFetcher(), "get");

      // useQuery로 캐시만 사용하는지 확인 (staleTime을 충분히 크게 지정)
      const { result: r1 } = renderHook(
        () =>
          useQuery({
            cacheKey: keyA,
            url: "/api/user/1",
            staleTime: 10000,
          }),
        { wrapper: createWrapper(client) }
      );

      const { result: r2 } = renderHook(
        () =>
          useQuery({ cacheKey: keyB, url: "/api/user/2", staleTime: 10000 }),
        { wrapper: createWrapper(client) }
      );

      expect(r1.current.data).toEqual(dataA);
      expect(r2.current.data).toEqual(dataB);
      expect(fetcherSpy).not.toHaveBeenCalled();
    });

    it("prefetch with queryFn", async () => {
      const cacheKey = ["complex", "prefetch"];
      const prefetchData = { prefetched: true };

      // queryFn으로 prefetch (첫 번째 오버로드 사용)
      await client.prefetchQuery(cacheKey, async () => {
        // 실제로는 fetcher를 사용할 수 있지만 여기서는 간단한 데이터 반환
        return prefetchData;
      });

      const fetcherSpy = vi.spyOn(client.getFetcher(), "get");

      // useQuery에서 캐시 사용
      const { result } = renderHook(
        () =>
          useQuery({
            cacheKey,
            queryFn: async () => ({ shouldNotBeCalled: true }),
            staleTime: 10000,
          }),
        { wrapper: createWrapper(client) }
      );

      expect(result.current.data).toEqual(prefetchData);
      expect(fetcherSpy).not.toHaveBeenCalled();
    });
  });
});
