import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createFetch } from "../src/core/client";
import { FetchError } from "../src/types/index";

describe("authRetry 옵션 (401 인증 오류 자동 재시도)", () => {
  // 전역 fetch 모킹
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  let callCount = 0;
  let handlerCount = 0;

  beforeEach(() => {
    callCount = 0;
    handlerCount = 0;
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // 여러 응답 시퀀스를 순서대로 반환하는 fetch 모킹 함수
  function mockFetchSequence(responses: Array<{ status: number; body?: any }>) {
    let idx = 0;
    mockFetch.mockImplementation(() => {
      const res = responses[Math.min(idx, responses.length - 1)];
      idx++;
      callCount++;
      return Promise.resolve({
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: String(res.status),
        headers: { get: () => "application/json" },
        json: async () => res.body ?? {},
        text: async () => JSON.stringify(res.body ?? {}),
      });
    });
  }

  it("handler가 true를 반환하면 401에서 재시도 후 성공해야 한다", async () => {
    mockFetchSequence([{ status: 401 }, { status: 200, body: { ok: true } }]);
    const api = createFetch({
      authRetry: {
        limit: 2,
        handler: async () => {
          handlerCount++;
          return true; // 토큰 갱신 성공, 재시도 허용
        },
      },
    });
    const res = await api.get("/test");
    expect(res.status).toBe(200);
    expect(callCount).toBe(2);
    expect(handlerCount).toBe(1);
  });

  it("handler가 false를 반환하면 재시도하지 않고 즉시 실패해야 한다", async () => {
    mockFetchSequence([
      { status: 401 },
      { status: 200, body: { ok: true } }, // 재시도 안함
    ]);
    const api = createFetch({
      authRetry: {
        limit: 2,
        handler: async () => {
          handlerCount++;
          return false; // 토큰 갱신 실패, 재시도 안함
        },
      },
    });
    await expect(api.get("/test")).rejects.toBeInstanceOf(FetchError);
    expect(callCount).toBe(1);
    expect(handlerCount).toBe(1);
  });

  it("limit만큼 재시도 후에도 401이면 총 limit+1회 시도 후 실패해야 한다", async () => {
    mockFetchSequence([{ status: 401 }, { status: 401 }, { status: 401 }]);
    const api = createFetch({
      authRetry: {
        limit: 2,
        handler: async () => {
          handlerCount++;
          return true; // 계속 재시도 요청
        },
      },
    });
    await expect(api.get("/test")).rejects.toBeInstanceOf(FetchError);
    expect(callCount).toBe(3); // limit=2 이면 총 3번 시도
    expect(handlerCount).toBe(2);
  });

  it("handler가 항상 true를 반환해도 무한 루프에 빠지지 않고 limit만큼만 호출된다", async () => {
    // 무한 루프 방지 검증: handler가 항상 true여도 limit만큼만 호출되어야 함
    const LIMIT = 5;
    mockFetchSequence(Array(LIMIT + 2).fill({ status: 401 }));

    const api = createFetch({
      authRetry: {
        limit: LIMIT,
        handler: async () => {
          handlerCount++;
          return true; // 항상 재시도 요청
        },
      },
    });

    await expect(api.get("/test")).rejects.toBeInstanceOf(FetchError);
    expect(callCount).toBe(LIMIT + 1); // 최초 1회 + limit회 재시도
    expect(handlerCount).toBe(LIMIT);
  });

  it("authRetry와 요청 인터셉터가 함께 동작할 때 토큰이 올바르게 반영된다", async () => {
    // 첫 번째 요청은 old-token, 재시도 요청은 new-token이 헤더에 들어가야 함
    let token = "old-token";
    mockFetchSequence([{ status: 401 }, { status: 200, body: { ok: true } }]);
    const api = createFetch({
      authRetry: {
        limit: 1,
        handler: async () => {
          token = "new-token";
          return true; // 토큰 갱신 성공, 재시도 허용
        },
      },
    });
    api.interceptors.request.use((config) => {
      return {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${token}` },
      };
    });
    const res = await api.get("/test");
    expect(res.status).toBe(200);
    // 첫 번째 요청은 old-token, 두 번째(재시도) 요청은 new-token이어야 함
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer old-token"
    );
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer new-token"
    );
  });

  it("access token이 만료되어 401 발생 시 refresh token으로 갱신 후 재시도에 성공해야 한다", async () => {
    // access token, refresh token 시나리오
    let accessToken = "expired-access-token";
    let refreshToken = "valid-refresh-token";
    let refreshCallCount = 0;

    // 첫 번째 요청: access token 만료(401), 두 번째 요청: 갱신된 access token으로 성공(200)
    mockFetchSequence([{ status: 401 }, { status: 200, body: { ok: true } }]);

    const api = createFetch({
      authRetry: {
        limit: 1,
        handler: async () => {
          refreshCallCount++;
          // refresh token이 유효하면 access token 갱신
          if (refreshToken === "valid-refresh-token") {
            accessToken = "new-access-token";
            return true;
          }
          // refresh token도 만료된 경우
          return false;
        },
      },
    });
    api.interceptors.request.use((config) => {
      return {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
      };
    });
    const res = await api.get("/test");
    expect(res.status).toBe(200);
    // 첫 번째 요청은 만료된 access token, 두 번째(재시도)는 갱신된 access token이어야 함
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer expired-access-token"
    );
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer new-access-token"
    );
    expect(refreshCallCount).toBe(1);
  });

  it("refresh token도 만료된 경우 재시도 없이 실패해야 한다", async () => {
    let accessToken = "expired-access-token";
    let refreshToken = "expired-refresh-token";
    let refreshCallCount = 0;

    mockFetchSequence([
      { status: 401 },
      { status: 200, body: { ok: true } }, // 재시도 없음
    ]);

    const api = createFetch({
      authRetry: {
        limit: 1,
        handler: async () => {
          refreshCallCount++;
          // refresh token이 만료된 경우
          return false;
        },
      },
    });
    api.interceptors.request.use((config) => {
      return {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
      };
    });
    await expect(api.get("/test")).rejects.toBeInstanceOf(FetchError);
    expect(callCount).toBe(1); // 재시도 없음
    expect(refreshCallCount).toBe(1);
  });
});
