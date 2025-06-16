import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: 코어 기능", () => {
  // 전역 fetch 모킹
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    // fetch 모킹
    global.fetch = mockFetch as unknown as typeof global.fetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    // 원래 fetch 복원
    global.fetch = originalFetch;
  });

  it("기본 인스턴스 생성", () => {
    const api = createFetch();

    expect(api).toBeDefined();
    expect(api.get).toBeInstanceOf(Function);
    expect(api.post).toBeInstanceOf(Function);
    expect(api.put).toBeInstanceOf(Function);
    expect(api.delete).toBeInstanceOf(Function);
    expect(api.patch).toBeInstanceOf(Function);
    expect(api.request).toBeInstanceOf(Function);
    expect(api.interceptors).toBeDefined();
    expect(api.defaults).toBeDefined();
  });

  it("기본 설정 옵션 적용", () => {
    const baseConfig = {
      baseURL: "https://api.example.com",
      headers: {
        "Content-Type": "application/json",
        "X-Custom-Header": "test-value",
      },
      timeout: 5000,
    };

    const api = createFetch(baseConfig);

    expect(api.defaults).toEqual(baseConfig);
  });

  it("기본 설정과 요청별 설정 병합", async () => {
    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => ({ data: "success" }),
    });

    // 기본 설정으로 인스턴스 생성
    const api = createFetch({
      baseURL: "https://api.example.com",
      headers: {
        Authorization: "Bearer default-token",
        Accept: "application/json",
        "X-Custom-Header": "Default Value",
      },
      timeout: 3000,
    });

    // 요청별 설정으로 일부 덮어쓰기
    await api.get("/resource", {
      headers: {
        Authorization: "Bearer request-specific-token",
        "X-Custom-Header": "Override Value",
      },
      timeout: 5000,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestInit = mockFetch.mock.calls[0][1];

    // 헤더가 올바르게 병합되었는지 확인
    expect(requestInit.headers.Authorization).toBe(
      "Bearer request-specific-token"
    );
    expect(requestInit.headers.Accept).toBe("application/json");
    expect(requestInit.headers["X-Custom-Header"]).toBe("Override Value");

    // 타임아웃이 올바르게 덮어쓰여졌는지 확인
    expect(requestInit.signal).toBeDefined();
  });

  it("동시 요청 처리", async () => {
    // 여러 응답 모킹
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 3 }),
      });

    const api = createFetch({ baseURL: "https://api.example.com" });

    // 동시에 여러 요청 실행
    const results = await Promise.all([
      api.get("/users/1"),
      api.get("/users/2"),
      api.get("/users/3"),
    ]);

    // 모든 요청이 성공적으로 처리되었는지 확인
    expect(results).toHaveLength(3);
    expect(results[0].data).toEqual({ id: 1 });
    expect(results[1].data).toEqual({ id: 2 });
    expect(results[2].data).toEqual({ id: 3 });

    // 각 요청이 올바른 URL로 전송되었는지 확인
    expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users/1");
    expect(mockFetch.mock.calls[1][0]).toBe("https://api.example.com/users/2");
    expect(mockFetch.mock.calls[2][0]).toBe("https://api.example.com/users/3");
  });

  it("URL 조합 테스트 (명시적 경로 보존)", async () => {
    // 응답 모킹 설정
    const mockResponse = { data: "success" };
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      })
    );

    const api = createFetch({ baseURL: "https://api.example.com/v1" });

    // 다양한 경로 패턴 테스트 - 명시적 경로 보존
    await api.get("/absolute/path");
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.example.com/v1/absolute/path"
    );

    await api.get("relative/path");
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://api.example.com/v1/relative/path"
    );

    // 상대 경로 표기는 그대로 보존됨 (안전하고 명시적)
    await api.get("./current/path");
    expect(mockFetch.mock.calls[2][0]).toBe(
      "https://api.example.com/v1/./current/path"
    );

    await api.get("../parent/path");
    expect(mockFetch.mock.calls[3][0]).toBe(
      "https://api.example.com/v1/../parent/path"
    );

    // 중첩된 baseURL 테스트
    const nestedApi = createFetch({
      baseURL: "https://api.example.com/v1/nested",
    });

    await nestedApi.get("/resource");
    expect(mockFetch.mock.calls[4][0]).toBe(
      "https://api.example.com/v1/nested/resource"
    );

    await nestedApi.get("../parent-resource");
    expect(mockFetch.mock.calls[5][0]).toBe(
      "https://api.example.com/v1/nested/../parent-resource"
    );
  });
});
