import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "../src/query/hooks/use-query";
import { createQueryFactory } from "../src/query/factories/query-factory";
import { z } from "zod/v4";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "../src/query/client/query-client";
import { QueryClientProvider } from "../src/query/client/query-client-provider";
import React from "react";

const mockResponse = (data: any) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: new Headers(),
  config: {},
});

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

// 테스트용 쿼리 팩토리 정의
const userQueries = createQueryFactory({
  // 파라미터가 필수인 쿼리
  getUser: {
    cacheKey: (id: number) => ["user", id] as const,
    url: (id: number) => `/api/user/${id}`,
    schema: z.object({ id: z.number(), name: z.string() }),
  },

  // 파라미터가 선택적인 쿼리
  getUserProfile: {
    cacheKey: (params?: { id?: number }) =>
      ["user", "profile", params?.id] as const,
    url: (params?: { id?: number }) =>
      `/api/user/${params?.id || "me"}/profile`,
    schema: z.object({ id: z.number(), name: z.string(), email: z.string() }),
    placeholderData: { id: 0, name: "로딩 중...", email: "" },
  },

  // 파라미터가 없는 리스트 쿼리
  getUserList: {
    cacheKey: () => ["users"] as const,
    url: () => "/api/users",
    schema: z.array(z.object({ id: z.number(), name: z.string() })),
  },

  // 조건부 enabled가 있는 검색 쿼리
  searchUsers: {
    cacheKey: (query: string) => ["users", "search", query] as const,
    url: (query: string) => `/api/users/search?q=${encodeURIComponent(query)}`,
    schema: z.array(z.object({ id: z.number(), name: z.string() })),
    enabled: (query: string) => query.length >= 3,
  },

  // select 함수가 있는 쿼리
  getUserWithTransform: {
    cacheKey: (id: number) => ["user", "transform", id] as const,
    url: (id: number) => `/api/user/${id}`,
    schema: z.object({ id: z.number(), name: z.string() }),
    select: (data: any) => ({ ...data, upperName: data.name.toUpperCase() }),
  },
});

describe("useQuery Factory-based 사용법", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
    client.clear();
    vi.clearAllMocks();
  });

  describe("파라미터가 필수인 쿼리", () => {
    it("정상적인 파라미터 전달 시 성공", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: 1, name: "Alice" })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUser, { params: 1 }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, name: "Alice" });
      expect(result.current.isSuccess).toBe(true);
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/user/1",
        expect.any(Object)
      );
    });

    it("스키마 검증 실패 시 에러 반환", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: "invalid", name: "Alice" })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUser, { params: 1 }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("파라미터가 선택적인 쿼리", () => {
    it("파라미터 없이 호출 시 기본값 사용", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: 999, name: "Current User", email: "me@example.com" })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUserProfile, {}),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        id: 999,
        name: "Current User",
        email: "me@example.com",
      });
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/user/me/profile",
        expect.any(Object)
      );
    });

    it("파라미터와 함께 호출 시 해당 파라미터 사용", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({
          id: 42,
          name: "Specific User",
          email: "user@example.com",
        })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUserProfile, { params: { id: 42 } }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        id: 42,
        name: "Specific User",
        email: "user@example.com",
      });
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/user/42/profile",
        expect.any(Object)
      );
    });
  });

  describe("파라미터가 없는 쿼리", () => {
    it("리스트 쿼리 정상 동작", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse([
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ])
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUserList, {}),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/users",
        expect.any(Object)
      );
    });
  });

  describe("조건부 enabled 쿼리", () => {
    it("짧은 검색어 시 fetch 하지 않음", () => {
      const fetcherSpy = vi.spyOn(client.getFetcher(), "get");

      const { result } = renderHook(
        () => useQuery(userQueries.searchUsers, { params: "ab" }),
        {
          wrapper: createWrapper(client),
        }
      );

      // enabled가 false일 때는 isLoading과 isFetching이 모두 false여야 함
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(fetcherSpy).not.toHaveBeenCalled();
    });

    it("긴 검색어 시 fetch 실행", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse([{ id: 1, name: "Alice Anderson" }])
      );

      const { result } = renderHook(
        () => useQuery(userQueries.searchUsers, { params: "alice" }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([{ id: 1, name: "Alice Anderson" }]);
      expect(client.getFetcher().get).toHaveBeenCalledWith(
        "/api/users/search?q=alice",
        expect.any(Object)
      );
    });
  });

  describe("Factory 옵션 오버라이드", () => {
    it("select 함수가 있는 Factory 쿼리", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: 1, name: "Alice" })
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUserWithTransform, { params: 1 }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        id: 1,
        name: "Alice",
        upperName: "ALICE",
      });
    });

    it("Factory select 함수를 런타임에 오버라이드", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: 1, name: "Alice" })
      );

      const { result } = renderHook(
        () =>
          useQuery(userQueries.getUser, {
            params: 1,
            select: (data: any) => data.name.toLowerCase(),
          }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 런타임 select가 적용되어야 함
      expect(result.current.data).toBe("alice");
    });

    it("staleTime 및 기타 옵션 오버라이드", async () => {
      vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
        mockResponse({ id: 1, name: "Alice" })
      );

      const { result } = renderHook(
        () =>
          useQuery(userQueries.getUser, {
            params: 1,
            staleTime: 10000,
            enabled: true,
          }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, name: "Alice" });
      expect(result.current.isStale).toBe(false);
    });
  });

  describe("에러 처리", () => {
    it("네트워크 에러 시 올바른 에러 반환", async () => {
      vi.spyOn(client.getFetcher(), "get").mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(
        () => useQuery(userQueries.getUser, { params: 1 }),
        {
          wrapper: createWrapper(client),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error)?.message).toBe("Network error");
      expect(result.current.data).toBeUndefined();
    });
  });
});
