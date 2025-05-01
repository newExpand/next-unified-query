import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: 인터셉터", () => {
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

	it("요청 인터셉터 작동 확인", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({}),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 인터셉터 추가
		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					Authorization: "Bearer test-token",
				},
			};
		});

		await api.get("/users");

		expect(mockFetch).toHaveBeenCalledTimes(1);

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers.Authorization).toBe("Bearer test-token");
	});

	it("응답 인터셉터 작동 확인", async () => {
		const mockResponse = { data: { id: 1, name: "Test" } };

		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => mockResponse,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 인터셉터 추가 - 응답에서 data 프로퍼티만 추출
		api.interceptors.response.use((response) => {
			if (response && typeof response === "object" && "data" in response) {
				return response.data;
			}
			return response;
		});

		const result = await api.get("/users/1");

		expect(result.data).toEqual({ id: 1, name: "Test" });
	});

	it("인터셉터 제거 기능 테스트", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "success" }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 요청 인터셉터 추가
		const requestInterceptorId = api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Test-Header": "test-value",
				},
			};
		});

		// 응답 인터셉터 추가
		const responseInterceptorId = api.interceptors.response.use((response) => {
			if (typeof response === "object" && response !== null) {
				return { ...response, modified: true };
			}
			return response;
		});

		// 첫 번째 요청 - 인터셉터 활성화 상태
		await api.get("/test");
		expect(mockFetch.mock.calls[0][1].headers["X-Test-Header"]).toBe("test-value");

		// 인터셉터 제거
		api.interceptors.request.eject(requestInterceptorId);
		api.interceptors.response.eject(responseInterceptorId);

		// 응답 모킹 리셋
		mockFetch.mockReset();
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "success" }),
		});

		// 두 번째 요청 - 인터셉터 제거 상태
		await api.get("/test");
		expect(mockFetch.mock.calls[0][1].headers["X-Test-Header"]).toBeUndefined();
	});

	it("여러 인터셉터 체이닝 테스트", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ value: 1 }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 여러 요청 인터셉터 추가
		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-First-Header": "first-value",
				},
			};
		});

		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Second-Header": "second-value",
				},
			};
		});

		// 여러 응답 인터셉터 추가
		api.interceptors.response.use((response) => {
			if (typeof response === "object" && response !== null) {
				return { ...response, first: true };
			}
			return response;
		});

		api.interceptors.response.use((response) => {
			if (typeof response === "object" && response !== null && "first" in response) {
				return { ...response, second: true };
			}
			return response;
		});

		await api.get("/test");

		// 요청 인터셉터가 순서대로 적용되었는지 확인
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["X-First-Header"]).toBe("first-value");
		expect(requestInit.headers["X-Second-Header"]).toBe("second-value");
	});

	it("응답 에러 인터셉터 테스트", async () => {
		// 네트워크 오류 모킹
		mockFetch.mockRejectedValueOnce(new Error("Original error"));

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 에러 인터셉터 추가
		api.interceptors.response.use(
			// 성공 응답 처리
			(response) => response,
			// 에러 응답 처리
			(error) => {
				if (error instanceof Error) {
					return new Error(`Intercepted: ${error.message}`);
				}
				return error;
			},
		);

		const result = await api.get("/error-endpoint");

		expect(result.data).toBeNull();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe("Intercepted: Original error");
	});
});
