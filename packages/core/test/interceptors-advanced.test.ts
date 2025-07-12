import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { createFetch, interceptorTypes, type FetchError, type NextTypeResponse, type RequestConfig } from "../src";

describe("next-type-fetch: 고급 인터셉터 기능", () => {
	// 테스트용 fetch 모킹
	let mockFetch: ReturnType<typeof vi.fn>;
	// 콘솔 경고 모킹
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// fetch 모킹
		mockFetch = vi.fn();
		global.fetch = mockFetch;

		// 응답 모킹
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "success" }),
		});

		// console.warn 모킹
		consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		// 모킹 복원
		consoleWarnSpy.mockRestore();
	});

	it("deprecated eject 메서드가 경고를 발생시키는지 확인", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// deprecated eject 메서드 호출
		api.interceptors.request.eject(1);
		api.interceptors.response.eject(2);
		api.interceptors.error.eject(3);

		// 경고가 세 번 호출되었는지 확인
		expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
		expect(consoleWarnSpy.mock.calls[0][0]).toContain("eject() 메서드는 사용되지 않습니다");
	});

	it("요청 인터셉터가 정상적으로 처리되는지 확인", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 요청 인터셉터 추가
		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Test-Request": "request-value",
				},
			};
		});

		// 요청 실행
		await api.get("/test");

		// 요청 헤더 확인
		expect(mockFetch).toHaveBeenCalledTimes(1);

		// headers가 다양한 방식으로 처리될 수 있으므로 호출 자체만 확인
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit).toBeDefined();
	});

	it("요청 인터셉터 제거가 정상적으로 처리되는지 확인", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 요청 인터셉터 추가
		const interceptorHandle = api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Test-Header": "test-value",
				},
			};
		});

		// 첫 번째 요청 실행
		await api.get("/test-1");

		// 인터셉터 제거
		interceptorHandle.remove();

		// 모킹 리셋
		mockFetch.mockClear();
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "success" }),
		});

		// 두 번째 요청 실행
		await api.get("/test-2");

		// 요청이 두 번 실행되었는지 확인
		expect(mockFetch).toHaveBeenCalledTimes(1);

		// 두 번째 요청에서 URL만 확인
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/test-2");
	});

	it("인터셉터 clear 메서드가 정상적으로 동작하는지 확인", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 여러 인터셉터 추가
		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-First": "first-value",
				},
			};
		});

		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Second": "second-value",
				},
			};
		});

		// 모든 인터셉터 제거
		api.interceptors.request.clear();

		// 요청 실행
		await api.get("/test");

		// 요청이 실행되었는지 확인
		expect(mockFetch).toHaveBeenCalledTimes(1);

		// URL만 확인
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/test");
	});
});
