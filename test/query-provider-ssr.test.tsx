import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ssrPrefetch } from "../src/query/ssr-prefetch";
import { QueryProvider } from "../src/query/ssr-provider";
import { useQuery } from "../src/query/use-query";
import { clearSSRPrefetch } from "../src/query/ssr-context";

const USER_DATA = { name: "SSRUser" };

describe("QueryProvider + ssrPrefetch + interceptors (SSR/CSR 통합)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    clearSSRPrefetch();
  });

  it("SSR prefetch 후 QueryProvider에서 hydrate + useQuery로 데이터 사용", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => USER_DATA,
      text: async () => JSON.stringify(USER_DATA),
    });

    // SSR prefetch (서버에서 실행 가정)
    await ssrPrefetch(
      {
        key: (params: { id: number }) => ["user", params.id],
        url: (params: { id: number }) => `/api/user/${params.id}`,
      },
      { id: 1 }
    );

    // 클라이언트에서 QueryProvider로 hydrate + useQuery로 데이터 확인
    const { result } = renderHook(
      () => useQuery({ key: ["user", 1], url: "/api/user/1" }),
      {
        wrapper: ({ children }) => <QueryProvider>{children}</QueryProvider>,
      }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual(USER_DATA);
    });
  });

  it("interceptors prop으로 여러 인터셉터가 적용되는지 확인", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => USER_DATA,
      text: async () => JSON.stringify(USER_DATA),
    });
    const logs: string[] = [];
    const authInterceptor = (fetcher: any) => {
      fetcher.interceptors.request.use((config: any) => {
        config.headers = { ...config.headers, Authorization: "Bearer SSR" };
        logs.push("auth");
        return config;
      });
    };
    const logInterceptor = (fetcher: any) => {
      fetcher.interceptors.request.use((config: any) => {
        logs.push("log");
        return config;
      });
    };
    const { result } = renderHook(
      () => useQuery({ key: ["user", 1], url: "/api/user/1" }),
      {
        wrapper: ({ children }) => (
          <QueryProvider interceptors={[authInterceptor, logInterceptor]}>
            {children}
          </QueryProvider>
        ),
      }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual(USER_DATA);
    });
    const fetchConfig = fetchMock.mock.calls[0][1];
    expect(fetchConfig.headers["Authorization"]).toBe("Bearer SSR");
    expect(logs).toContain("auth");
    expect(logs).toContain("log");
  });
});
