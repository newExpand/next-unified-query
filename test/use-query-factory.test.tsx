import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "../src/query/use-query";
import { createQueryFactory } from "../src/query/query-factory";
import { z } from "zod/v4";
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

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe("useQuery (createQueryFactory 기반, params undefined 허용)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("params가 undefined일 때 placeholderData만 반환 (enabled: false)", () => {
    const queries = createQueryFactory({
      detail: {
        key: (params?: { id: number }) => ["user", params?.id],
        url: (params?: { id: number }) => `/api/user/${params?.id ?? ""}`,
        schema: z.object({ id: z.number(), name: z.string() }),
        placeholderData: { name: "로딩" },
        enabled: false,
      },
    });
    const client = new QueryClient();
    const { result } = renderHook(() => useQuery(queries.detail), {
      wrapper: createWrapper(client),
    });
    expect(result.current.data).toEqual({ name: "로딩" });
  });

  it("params가 undefined일 때 fetcher 호출 및 데이터 반환 (enabled: true)", async () => {
    const queries = createQueryFactory({
      detail: {
        key: (params?: { id: number }) => ["user", params?.id],
        url: (params?: { id: number }) => `/api/user/${params?.id ?? ""}`,
        schema: z.object({ id: z.number(), name: z.string() }),
        select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
        enabled: true,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 0, name: "NoId" })
    );
    const { result } = renderHook(() => useQuery(queries.detail), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        id: 0,
        name: "NoId",
        upperName: "NOID",
      });
    });
  });

  it("params가 명시적으로 전달될 때 fetcher 호출 및 데이터 반환 (enabled: true)", async () => {
    const queries = createQueryFactory({
      detail: {
        key: (params?: { id: number }) => ["user", params?.id],
        url: (params?: { id: number }) => `/api/user/${params?.id ?? ""}`,
        schema: z.object({ id: z.number(), name: z.string() }),
        select: (data) => ({ ...data, upperName: data.name.toUpperCase() }),
        enabled: true,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: 1, name: "Alice" })
    );
    const { result } = renderHook(() => useQuery(queries.detail, { id: 1 }), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        id: 1,
        name: "Alice",
        upperName: "ALICE",
      });
    });
  });

  it("list 쿼리: params 없이 정상 동작 (enabled: true)", async () => {
    const queries = createQueryFactory({
      list: {
        key: () => ["user", "list"],
        url: () => `/api/user`,
        schema: z.array(z.object({ id: z.number(), name: z.string() })),
        enabled: true,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ])
    );
    const { result } = renderHook(() => useQuery(queries.list), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => {
      expect(result.current.data).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });
  });

  it("schema 검증 실패 시 error 반환 (enabled: true)", async () => {
    const queries = createQueryFactory({
      detail: {
        key: (params?: { id: number }) => ["user", params?.id],
        url: (params?: { id: number }) => `/api/user/${params?.id ?? ""}`,
        schema: z.object({ id: z.number(), name: z.string() }),
        enabled: true,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockResolvedValueOnce(
      mockResponse({ id: "not-a-number", name: "Alice" })
    );
    const { result } = renderHook(() => useQuery(queries.detail, { id: 1 }), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isError).toBe(true);
    });
  });

  it("fetcher가 에러를 throw하면 error 필드에 반영 (enabled: true)", async () => {
    const queries = createQueryFactory({
      detail: {
        key: (params?: { id: number }) => ["user", params?.id],
        url: (params?: { id: number }) => `/api/user/${params?.id ?? ""}`,
        schema: z.object({ id: z.number(), name: z.string() }),
        enabled: true,
      },
    });
    const client = new QueryClient();
    vi.spyOn(client.getFetcher(), "get").mockRejectedValueOnce(
      new Error("Network error")
    );
    const { result } = renderHook(() => useQuery(queries.detail, { id: 1 }), {
      wrapper: createWrapper(client),
    });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.isError).toBe(true);
    });
  });
});
