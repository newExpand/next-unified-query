import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src";

describe("next-type-fetch: 추가 HTTP 메서드 테스트", () => {
	// 테스트용 fetch 모킹
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// fetch 모킹
		mockFetch = vi.fn();
		global.fetch = mockFetch;

		// 기본 성공 응답 설정
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});
	});

	it("HEAD 메서드 테스트", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });
		await api.head("/head-endpoint");

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("HEAD");
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/head-endpoint");
	});

	it("OPTIONS 메서드 테스트", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });
		await api.options("/options-endpoint");

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("OPTIONS");
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/options-endpoint");
	});

	it("HEAD 메서드 커스텀 헤더 테스트", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });
		await api.head("/head-endpoint", {
			headers: {
				"X-Custom-Header": "custom-value",
			},
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["X-Custom-Header"]).toBe("custom-value");
	});

	it("OPTIONS 메서드 커스텀 헤더 테스트", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });
		await api.options("/options-endpoint", {
			headers: {
				"X-Custom-Header": "custom-value",
			},
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["X-Custom-Header"]).toBe("custom-value");
	});

	it("메서드 함수 체이닝 테스트", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 여러 메서드를 연속으로 호출
		await api.get("/test-get");
		await api.post("/test-post");
		await api.put("/test-put");
		await api.patch("/test-patch");
		await api.delete("/test-delete");
		await api.head("/test-head");
		await api.options("/test-options");

		// 모든 메서드가 올바르게 호출되었는지 확인
		expect(mockFetch).toHaveBeenCalledTimes(7);

		// 각 메서드의 method 속성 확인
		const methods = mockFetch.mock.calls.map((call) => call[1].method);
		expect(methods).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

		// 각 메서드의 URL 확인
		const urls = mockFetch.mock.calls.map((call) => call[0]);
		expect(urls).toEqual([
			"https://api.example.com/test-get",
			"https://api.example.com/test-post",
			"https://api.example.com/test-put",
			"https://api.example.com/test-patch",
			"https://api.example.com/test-delete",
			"https://api.example.com/test-head",
			"https://api.example.com/test-options",
		]);
	});
});
