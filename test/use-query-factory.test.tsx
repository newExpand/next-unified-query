import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "../src/query/use-query";
import { createQueryFactory } from "../src/query/query-factory";
import { z } from "zod";
import { renderHook, act, waitFor } from "@testing-library/react";
import api from "../src/index";
import { QueryClient } from "../src/query/query-client";
import { QueryClientProvider } from "../src/query/query-client-provider";
import React from "react";

// api.get을 mock 처리
vi.mock("../src/index", () => ({
  default: {
    get: vi.fn(),
  },
}));

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

const createWrapper = () => {
  const client = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("useQuery (createQueryFactory 기반)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("placeholderData: detail 선언부 기반으로 타입 안전하게 사용 가능", () => {
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
    );
    expect(result.current.data).toEqual({ name: "로딩" });
  });

  it("실제 fetch 동작: data가 정상적으로 패칭됨", async () => {
    (api.get as any).mockResolvedValueOnce({ data: { id: 1, name: "Alice" } });
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({
      data: { id: "not-a-number", name: "Alice" },
    });
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it("select 옵션 동작: upperName 필드 추가", async () => {
    (api.get as any).mockResolvedValueOnce({ data: { id: 2, name: "Bob" } });
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 2 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({ data: { name: "A" } });
    const { result, rerender } = renderHook(
      ({ id }) => useQuery(customQueries.detail, { id }),
      { initialProps: { id: 1 }, wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.data).toEqual({ name: "A" }));
    (api.get as any).mockResolvedValueOnce({ data: { name: "B" } });
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
    const { result } = renderHook(
      () => useQuery(customQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
    );
    expect(result.current.isLoading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("에러 처리: fetcher가 에러를 throw하면 error 필드에 반영", async () => {
    (api.get as any).mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.isError).toBe(true);
    });
  });

  it("refetch 동작: refetch 호출 시 데이터가 다시 패칭됨", async () => {
    (api.get as any).mockResolvedValueOnce({ data: { id: 1, name: "Alice" } });
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ name: "Alice" })
    );
    (api.get as any).mockResolvedValueOnce({ data: { id: 1, name: "Bob" } });
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ name: "Bob" })
    );
  });

  it("상태값: isLoading, isFetching, isError, isSuccess 동작", async () => {
    (api.get as any).mockResolvedValueOnce({ data: { id: 1, name: "Alice" } });
    const { result } = renderHook(
      () => useQuery(userQueries.detail, { id: 1 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({ data: { id: 1, name: "Alice" } });
    const { result } = renderHook(
      () => useQuery(customQueries.onlyId, { id: 1 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({ data: { id: 2, name: "BOB" } });
    const { result } = renderHook(
      () => useQuery(customQueries.lowerName, { id: 2 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({
      data: { id: 3, name: "Charlie" },
    });
    const { result } = renderHook(
      () => useQuery(customQueries.raw, { id: 3 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({ data: { id: 4, name: "Delta" } });
    const { result } = renderHook(
      () => useQuery(customQueries.empty, { id: 4 }),
      { wrapper: createWrapper() }
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
    (api.get as any).mockResolvedValueOnce({ data: { id: 5, name: "Echo" } });
    const { result } = renderHook(
      () => useQuery(customQueries.toArray, { id: 5 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual([5, "Echo"]);
    });
  });
});
