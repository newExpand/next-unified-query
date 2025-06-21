import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch, FetchError } from "../src/index.js";

describe("next-type-fetch: 고급 기능", () => {
	// 전역 fetch 모킹
	const originalFetch = global.fetch;
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// fetch 모킹
		mockFetch = vi.fn();
		global.fetch = mockFetch as unknown as typeof global.fetch;
	});

	afterEach(() => {
		// 원래 fetch 복원
		global.fetch = originalFetch;
	});

	it("타임아웃 처리", async () => {
		// 매우 긴 지연 시간을 가진 응답 모킹
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					// 실제로는 타임아웃보다 오래 걸리는 작업
					setTimeout(() => {
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Headers({
								"content-type": "application/json",
							}),
							json: async () => ({ data: "too late" }),
						});
					}, 1000);
				}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });

		try {
			await api.get("/delayed-endpoint", { timeout: 50 });
			throw new Error("타임아웃이 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			// 코드는 현재 구현에 따라 ERR_NETWORK 또는 ERR_TIMEOUT일 수 있음
			expect(error.message).toContain("timeout");
		}
	});

	it("retry 옵션 설정", async () => {
		// 첫 번째 요청은 실패, 두 번째는 성공하도록 모킹
		mockFetch.mockRejectedValueOnce(new Error("Network error")).mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "success after retry" }),
		});

		// 테스트 목적으로 임시 패치
		const originalFetch = global.fetch;
		let fetchCallCount = 0;
		global.fetch = (...args) => {
			fetchCallCount++;
			return mockFetch(...args);
		};

		try {
			const api = createFetch({
				baseURL: "https://api.example.com",
				retry: 1, // 1회 재시도
			});

			const result = await api.get("/unstable-endpoint");

			expect(fetchCallCount).toBe(2); // 재시도로 총 2번 호출
			expect(result.data).toEqual({ data: "success after retry" });
		} finally {
			// 원래 fetch 복원
			global.fetch = originalFetch;
		}
	});

	it("여러 번 재시도와 재시도 실패", async () => {
		// 모든 요청이 실패하도록 모킹
		mockFetch
			.mockRejectedValueOnce(new Error("Network error 1"))
			.mockRejectedValueOnce(new Error("Network error 2"))
			.mockRejectedValueOnce(new Error("Network error 3"));

		// 테스트 목적으로 임시 패치
		const originalFetch = global.fetch;
		let fetchCallCount = 0;
		global.fetch = (...args) => {
			fetchCallCount++;
			return mockFetch(...args);
		};

		try {
			const api = createFetch({
				baseURL: "https://api.example.com",
				retry: 2, // 2회 재시도
			});

			try {
				await api.get("/always-fail");
				throw new Error("네트워크 오류가 발생해야 합니다");
			} catch (error) {
				expect(fetchCallCount).toBe(3); // 원래 요청 + 재시도 2회 = 총 3번 호출
				expect(error).toBeInstanceOf(FetchError);
				expect(error.code).toBe("ERR_NETWORK");
				expect(error.message).toBe("Network error 3"); // 마지막 에러 메시지
			}
		} finally {
			// 원래 fetch 복원
			global.fetch = originalFetch;
		}
	});

	it("타임아웃과 재시도 조합", async () => {
		// 첫 번째 요청은 타임아웃(무한 대기), 두 번째는 성공하도록 모킹
		mockFetch
			.mockImplementationOnce(() => new Promise(() => {})) // 무한 대기
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Headers({
					"content-type": "application/json",
				}),
				json: async () => ({ data: "success after timeout" }),
			});

		const api = createFetch({
			baseURL: "https://api.example.com",
			retry: 1, // 1회 재시도
			timeout: 100, // 100ms 타임아웃
		});

		const result = await api.get("/timeout-then-success");

		expect(result.data).toEqual({ data: "success after timeout" });
	});

	it("복잡한 요청 설정 조합", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ data: "complex settings" }),
		});

		const api = createFetch({
			baseURL: "https://api.example.com",
			headers: {
				"X-API-Key": "default-key",
			},
		});

		await api.get("/complex", {
			params: { id: 123, filter: "active" },
			headers: {
				"X-Request-ID": "abc-123",
			},
			timeout: 2000,
			retry: 2,
			cache: "no-store",
			next: { revalidate: 60, tags: ["user"] },
		});

		const requestInit = mockFetch.mock.calls[0][1];

		// 헤더 접근 방식 수정 (대소문자 구분 없이 확인)
		const findHeader = (name: string) =>
			Object.keys(requestInit.headers).find((key) => key.toLowerCase() === name.toLowerCase());

		const apiKeyHeader = findHeader("X-API-Key");
		const requestIdHeader = findHeader("X-Request-ID");

		expect(apiKeyHeader).toBeDefined();
		expect(requestIdHeader).toBeDefined();

		if (apiKeyHeader) {
			expect(requestInit.headers[apiKeyHeader]).toBe("default-key");
		}

		if (requestIdHeader) {
			expect(requestInit.headers[requestIdHeader]).toBe("abc-123");
		}

		// 각 옵션이 올바르게 적용되었는지 확인
		expect(requestInit.cache).toBe("no-store");
		expect(requestInit.next.revalidate).toBe(60);
		expect(requestInit.next.tags).toEqual(["user"]);

		// URL에 쿼리 파라미터가 포함되었는지 확인
		const url = mockFetch.mock.calls[0][0];
		expect(url).toContain("id=123");
		expect(url).toContain("filter=active");
	});
});
