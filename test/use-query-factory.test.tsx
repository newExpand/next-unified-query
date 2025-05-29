import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "../src/query/use-query";
import { createQueryFactory } from "../src/query/query-factory";
import { z } from "zod";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient } from "../src/query/query-client";
import { QueryClientProvider } from "../src/query/query-client-provider";
import React from "react";

const mockResponse = (data: any) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: new Headers(),
  config: {},
});

const userQueries = createQueryFactory({
  detail: {
    key: (params: { id: number }) => ["user", params.id],
    url: (params: { id: number }) => `/api/user/${params.id}`,
    schema: z.object({ id: z.number(), name: z.string() }),
    placeholderData: { name: "로딩" },
    select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
    fetchConfig: { timeout: 1000 },
    enabled: (params) => params.id > 0,
  },
  list: {
    key: () => ["user", "list"],
    url: () => `/api/user`,
    schema: z.array(z.object({ id: z.number(), name: z.string() })),
    placeholderData: [],
  },
});

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("useQuery (createQueryFactory 기반)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("placeholderData: detail 선언부 기반으로 타입 안전하게 사용 가능", () => {
    const client = new QueryClient();
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    expect(result.current.data).toEqual({ name: "로딩" });
  });

  it("실제 fetch 동작: data가 정상적으로 패칭됨", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Alice" })
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        id: 1,
        name: "Alice",
        upperName: "ALICE",
      });
    });
  });

  it("schema 검증: 잘못된 데이터는 에러 발생", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: "not-a-number", name: "Alice" })
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it("select 옵션 동작: upperName 필드 추가", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 2, name: "Bob" })
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 2 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toMatchObject({ upperName: "BOB" });
    });
  });

  it("placeholderData(prev) 함수 동작: 이전 데이터 유지", async () => {
    const customQueries = createQueryFactory({
      detail: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        placeholderData: (prev) => prev ?? { name: "로딩" },
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ name: "A" })
    );
    const { result, rerender } = renderHook(
      ({ id }) => useQuery(customQueries.detail, { id }),
      { initialProps: { id: 1 }, wrapper: createWrapper(client) }
    );
    await waitFor(() => expect(result.current.data).toEqual({ name: "A" }));
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ name: "B" })
    );
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toEqual({ name: "B" }));
  });

  it("enabled 옵션 동작: false면 fetch 안함", () => {
    const customQueries = createQueryFactory({
      detail: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        enabled: () => false,
      },
    });
    const client = new QueryClient();
    const cancelablePromise = Object.assign(
      Promise.resolve(mockResponse(undefined)),
      { cancel: () => {}, isCanceled: () => false }
    );
    vi.spyOn(client.getFetcher(), "get").mockImplementation(
      () => cancelablePromise
    );
    const { result } = renderHook(
      () => useQuery(customQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    expect(result.current.isLoading).toBe(false);
    expect(client.getFetcher().get).not.toHaveBeenCalled();
  });

  it("에러 처리: fetcher가 에러를 throw하면 error 필드에 반영", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockRejectedValueOnce(
      new Error("Network error")
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.isError).toBe(true);
    });
  });

  it("refetch 동작: refetch 호출 시 데이터가 다시 패칭됨", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Alice" })
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ name: "Alice" })
    );
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Bob" })
    );
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ name: "Bob" })
    );
  });

  it("상태값: isLoading, isFetching, isError, isSuccess 동작", async () => {
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Alice" })
    );
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it("select: 필드를 제거하는 경우", async () => {
    const customQueries = createQueryFactory({
      onlyId: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        select: (data) => ({ id: data.id }),
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Alice" })
    );
    const { result } = renderHook(
      () => useQuery(customQueries.onlyId, { id: 1 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  it("select: 필드를 변형하는 경우", async () => {
    const customQueries = createQueryFactory({
      lowerName: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        select: (data) => ({ ...data, name: data.name.toLowerCase() }),
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 2, name: "BOB" })
    );
    const { result } = renderHook(
      () => useQuery(customQueries.lowerName, { id: 2 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2, name: "bob" });
    });
  });

  it("select: select가 없을 때 원본 데이터 반환", async () => {
    const customQueries = createQueryFactory({
      raw: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 3, name: "Charlie" })
    );
    const { result } = renderHook(
      () => useQuery(customQueries.raw, { id: 3 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 3, name: "Charlie" });
    });
  });

  it("select: select가 undefined를 반환하는 경우", async () => {
    const customQueries = createQueryFactory({
      empty: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        select: () => undefined,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 4, name: "Delta" })
    );
    const { result } = renderHook(
      () => useQuery(customQueries.empty, { id: 4 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  it("select: select가 배열을 반환하는 경우", async () => {
    const customQueries = createQueryFactory({
      toArray: {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
        select: (data) => [data.id, data.name],
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 5, name: "Echo" })
    );
    const { result } = renderHook(
      () => useQuery(customQueries.toArray, { id: 5 }),
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual([5, "Echo"]);
    });
  });
});
