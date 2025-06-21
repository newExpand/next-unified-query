import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch, FetchError } from "../src/index.js";

describe("next-type-fetch: 요청 취소", () => {
	// 테스트용 fetch 모킹
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// fetch 모킹
		mockFetch = vi.fn();
		global.fetch = mockFetch;
	});

	it("요청 취소 기능", async () => {
		// 응답 모킹 - 실제로는 호출되지 않음
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					// 오래 걸리는 작업 시뮬레이션
					setTimeout(() => {
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Headers(),
							json: async () => ({ data: "success" }),
						});
					}, 500);
				}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });

		// AbortController 생성
		const controller = new AbortController();

		// 요청 시작 및 취소
		const requestPromise = api.get("/cancel-test", {
			signal: controller.signal,
		});

		// 요청 즉시 취소
		controller.abort();

		try {
			await requestPromise;
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			expect(error.message).toContain("canceled");
		}
	});

	it("promise.cancel() 메서드를 사용한 요청 취소", async () => {
		// 응답 모킹 - 실제로는 호출되지 않음
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					// 오래 걸리는 작업 시뮬레이션
					setTimeout(() => {
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Headers(),
							json: async () => ({ data: "success" }),
						});
					}, 500);
				}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 요청 시작
		const requestPromise = api.get("/direct-cancel-test");

		// promise.cancel() 메서드를 직접 호출하여 요청 취소
		requestPromise.cancel();

		try {
			await requestPromise;
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			expect(error.message).toContain("canceled");
		}
	});

	it("외부 AbortController로 요청 취소", async () => {
		// 응답 모킹 - 실제로는 호출되지 않음
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					// 오래 걸리는 작업 시뮬레이션
					setTimeout(() => {
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Headers(),
							json: async () => ({ data: "success" }),
						});
					}, 500);
				}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });
		const controller = new AbortController();

		// 요청 시작 및 취소
		const requestPromise = api.get("/delayed-endpoint", {
			signal: controller.signal,
		});

		// 즉시 취소
		controller.abort();

		try {
			await requestPromise;
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			expect(error.message).toContain("canceled");
		}
	});

	it("이미 취소된 AbortSignal로 요청 시도", async () => {
		// 응답 모킹 - 실제로는 호출되지 않음
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolve({
						ok: true,
						status: 200,
						statusText: "OK",
						headers: new Headers(),
						json: async () => ({ data: "success" }),
					});
				}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });
		const controller = new AbortController();

		// 미리 취소
		controller.abort();

		try {
			await api.get("/never-called", { signal: controller.signal });
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			expect(error.message).toContain("canceled");
			expect(mockFetch).not.toHaveBeenCalled(); // fetch가 호출되지 않았는지 확인
		}
	});

	it("취소된 요청의 에러 객체 구조 확인", async () => {
		const api = createFetch({ baseURL: "https://api.example.com" });
		const controller = new AbortController();

		// 요청 시작
		const requestPromise = api.get("/test", {
			signal: controller.signal,
		});

		// 즉시 취소
		controller.abort();

		try {
			await requestPromise;
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			expect(error.message).toContain("canceled");

			// 요청 설정이 에러 객체에 포함되었는지 확인
			expect(error.config).toBeDefined();
			expect(error.config.baseURL).toBe("https://api.example.com");
			expect(error.config.url).toBe("/test");
		}
	});

	it("타임아웃과 취소의 상호작용", async () => {
		// 응답 모킹 - 실제로는 호출되지 않음
		mockFetch.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					// 타임아웃보다 오래 걸리는 작업
					setTimeout(() => {
						resolve({
							ok: true,
							status: 200,
							statusText: "OK",
							headers: new Headers(),
							json: async () => ({ data: "success" }),
						});
					}, 500);
				}),
		);

		const api = createFetch({
			baseURL: "https://api.example.com",
			timeout: 300, // 300ms 타임아웃
		});

		const controller = new AbortController();
		const requestPromise = api.get("/test", {
			signal: controller.signal,
		});

		// 타임아웃보다 먼저 취소
		controller.abort();

		try {
			await requestPromise;
			throw new Error("요청이 취소되었을 때 에러가 발생해야 합니다");
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect(error.code).toBe("ERR_CANCELED");
			// 취소가 타임아웃보다 먼저 발생했으므로 취소 에러가 발생해야 함
			expect(error.message).not.toContain("timeout");
		}
	});
});
