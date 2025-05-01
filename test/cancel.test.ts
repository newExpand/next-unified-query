import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: 요청 취소", () => {
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

	it("요청 취소 기능", async () => {
		// 응답 지연을 모방하는 mock 구현
		mockFetch.mockImplementationOnce(() => {
			let rejectFn: (reason?: Error) => void;

			// AbortError를 생성하여 rejection을 시뮬레이션
			const abortPromise = new Promise<Response>((_, reject) => {
				rejectFn = reject;
			});

			// 100ms 후에 자동으로 reject되지만, 그 전에 abort 이벤트가 발생하면 즉시 reject
			setTimeout(() => {
				const error = new Error("Timeout mock");
				error.name = "AbortError";
				rejectFn(error);
			}, 100);

			return abortPromise;
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 요청 시작하고 취소 가능한 프로미스 받기
		const request = api.get("/delayed-endpoint");

		// request가 Promise를 상속하면서 cancel 메서드를 가지고 있는지 확인
		expect(request).toBeInstanceOf(Promise);
		expect(request.cancel).toBeInstanceOf(Function);
		expect(request.isCanceled).toBeInstanceOf(Function);

		// 요청이 아직 취소되지 않았는지 확인
		expect(request.isCanceled()).toBe(false);

		// 요청 취소
		request.cancel();

		// 요청이 취소되었는지 확인
		expect(request.isCanceled()).toBe(true);

		// 응답 확인 - 취소된 요청이므로 에러 응답이 와야 함
		const result = await request;
		expect(result.data).toBeNull();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe("Request was canceled");
	});

	it("외부 AbortController로 요청 취소", async () => {
		// 응답 지연을 모방하는 mock 구현
		mockFetch.mockImplementationOnce(() => {
			let rejectFn: (reason?: Error) => void;

			// AbortError를 생성하여 rejection을 시뮬레이션
			const abortPromise = new Promise<Response>((_, reject) => {
				rejectFn = reject;
			});

			// 100ms 후에 자동으로 reject되지만, 그 전에 abort 이벤트가 발생하면 즉시 reject
			setTimeout(() => {
				const error = new Error("Timeout mock");
				error.name = "AbortError";
				rejectFn(error);
			}, 100);

			return abortPromise;
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 외부 AbortController 생성
		const controller = new AbortController();

		// signal 전달하여 요청 시작
		const request = api.get("/delayed-endpoint", { signal: controller.signal });

		// 요청이 아직 취소되지 않았는지 확인
		expect(request.isCanceled()).toBe(false);

		// 외부 controller로 요청 취소
		controller.abort();

		// 약간의 지연 후 취소 상태 확인 (이벤트 리스너가 처리되는 시간 고려)
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 요청이 취소되었는지 확인
		expect(request.isCanceled()).toBe(true);

		// 응답 확인
		const result = await request;
		expect(result.data).toBeNull();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe("Request was canceled");
	});

	it("이미 취소된 AbortSignal로 요청 시도", async () => {
		// mockFetch를 리셋
		mockFetch.mockReset();

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 이미 취소된 controller 생성
		const controller = new AbortController();
		controller.abort();

		// 이미 취소된 signal로 요청
		const request = api.get("/never-called", { signal: controller.signal });

		// 잠시 기다려서 비동기 처리 완료
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 즉시 취소되어야 함
		expect(request.isCanceled()).toBe(true);

		// fetch가 실제로 호출되지 않아야 함
		expect(mockFetch).not.toHaveBeenCalled();

		// 응답 확인
		const result = await request;
		expect(result.data).toBeNull();
		expect(result.error).toBeDefined();
		expect(result.error?.message).toBe("Request was canceled");
	});

	it("취소된 요청의 에러 객체 구조 확인", async () => {
		// mockFetch를 리셋
		mockFetch.mockReset();

		const api = createFetch({ baseURL: "https://api.example.com" });
		const request = api.get("/to-be-canceled");

		// 요청 취소
		request.cancel();

		// 응답 확인
		const result = await request;

		// 응답 구조 확인
		expect(result).toMatchObject({
			data: null,
			error: {
				message: "Request was canceled",
				raw: expect.any(Error),
			},
			status: 0,
			headers: expect.any(Headers),
		});
	});

	it("타임아웃과 취소의 상호작용", async () => {
		// 무한 대기하는 응답 모킹
		mockFetch.mockImplementationOnce(() => new Promise(() => {}));

		const api = createFetch({
			baseURL: "https://api.example.com",
			timeout: 1000, // 1초 타임아웃
		});

		const request = api.get("/long-request");

		// 타임아웃보다 먼저 직접 취소
		request.cancel();

		const result = await request;

		// 타임아웃이 아닌 취소로 인한 에러여야 함
		expect(result.error?.message).toBe("Request was canceled");
		expect(result.status).toBe(0);
	});
});
