import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  get,
  post,
  put,
  patch,
  head,
  options,
  del,
  request,
  ntFetch,
  interceptors,
} from "../src/index.js";
import { defaultInstance } from "../src/index.js";

describe("next-type-fetch: 기본 인스턴스", () => {
  // 전역 fetch 모킹
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // fetch 모킹
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // 원래 fetch 복원
    global.fetch = originalFetch;
  });

  it("기본 인스턴스에서 메서드 직접 사용", async () => {
    const mockResponse = {
      id: 1,
      name: "Test User",
    };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    const result = await get("/users/1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users/1");
    expect(result.data).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  it("POST 메서드 직접 사용", async () => {
    const requestData = { name: "New User" };
    const mockResponse = { id: 123, ...requestData };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      statusText: "Created",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    const result = await post("/users", requestData);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("POST");
    expect(JSON.parse(requestInit.body)).toEqual(requestData);

    expect(result.data).toEqual(mockResponse);
    expect(result.status).toBe(201);
  });

  it("PUT 메서드 직접 사용", async () => {
    const requestData = { name: "Updated User" };
    const mockResponse = { id: 1, ...requestData };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    const result = await put("/users/1", requestData);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users/1");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("PUT");
    expect(JSON.parse(requestInit.body)).toEqual(requestData);

    expect(result.data).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  it("PATCH 메서드 직접 사용", async () => {
    const requestData = { name: "Patched User" };
    const mockResponse = { id: 1, ...requestData, email: "test@example.com" };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    const result = await patch("/users/1", requestData);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users/1");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("PATCH");
    expect(JSON.parse(requestInit.body)).toEqual(requestData);

    expect(result.data).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  it("DELETE 메서드 직접 사용", async () => {
    const mockResponse = { success: true };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    const result = await del("/users/1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users/1");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("DELETE");

    expect(result.data).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  it("HEAD 메서드 직접 사용", async () => {
    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
        "x-total-count": "42",
      }),
      json: async () => ({}),
      text: async () => "",
    });

    const result = await head("/users");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("HEAD");

    expect(result.status).toBe(200);
    expect(result.headers.get("x-total-count")).toBe("42");
  });

  it("OPTIONS 메서드 직접 사용", async () => {
    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH",
        "access-control-allow-origin": "*",
      }),
      json: async () => ({}),
      text: async () => "",
    });

    const result = await options("/users");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users");

    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.method).toBe("OPTIONS");

    expect(result.status).toBe(200);
    expect(result.headers.get("access-control-allow-methods")).toBe(
      "GET, POST, PUT, DELETE, PATCH"
    );
  });

  it("기본 인스턴스 설정 변경", async () => {
    // 기본 설정 변경
    ntFetch.baseURL = "https://api.example.com";

    const mockResponse = { success: true };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    // 요청 실행
    await get("/users");

    // 설정이 적용되었는지 확인
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users");

    // 테스트 후 설정 정리
    ntFetch.baseURL = undefined;
  });

  it("인터셉터 사용", async () => {
    const requestInterceptor = vi.fn((config) => {
      config.headers = {
        ...config.headers,
        "X-Test-Header": "test-value",
      };
      return config;
    });

    // 인터셉터 추가
    const interceptorHandle = interceptors.request.use(requestInterceptor);

    const mockResponse = { success: true };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    // 요청 실행
    await get("/test");

    // 인터셉터가 호출되었는지 확인
    expect(requestInterceptor).toHaveBeenCalled();

    // 요청 헤더가 수정되었는지 확인
    const requestInit = mockFetch.mock.calls[0][1];
    expect(requestInit.headers["X-Test-Header"]).toBe("test-value");

    // 테스트 후 인터셉터 제거
    interceptorHandle.remove();
  });

  it("defaultInstance 직접 사용", async () => {
    const mockResponse = { id: 1, name: "Test User" };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    // 기본 인스턴스 사용
    const result = await defaultInstance.get("/users/1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/users/1");
    expect(result.data).toEqual(mockResponse);
  });

  it("request 메서드 직접 사용", async () => {
    const mockResponse = { success: true };

    // 응답 모킹
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => mockResponse,
    });

    // request 메서드 직접 사용
    const result = await request({
      url: "/test",
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/test");
    expect(result.data).toEqual(mockResponse);
  });
});
