import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: Next.js 캐싱", () => {
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

	it("Next.js 캐시 옵션 테스트", async () => {
		// 응답 모킹
		const mockResponse = { data: "cached" };
		mockFetch.mockImplementation(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => mockResponse,
			}),
		);

		const api = createFetch({ baseURL: "https://api.example.com" });

		// no-store 옵션 테스트
		await api.get("/data", { cache: "no-store" });
		expect(mockFetch.mock.calls[0][1].cache).toBe("no-store");

		// force-cache 옵션 테스트
		await api.get("/data", { cache: "force-cache" });
		expect(mockFetch.mock.calls[1][1].cache).toBe("force-cache");

		// reload 옵션 테스트
		await api.get("/data", { cache: "reload" });
		expect(mockFetch.mock.calls[2][1].cache).toBe("reload");

		// next.revalidate 옵션 테스트
		await api.get("/data", {
			next: { revalidate: 60 },
		});
		// next 속성이 올바르게 전달되는지 확인
		const requestInit = mockFetch.mock.calls[3][1];
		expect(requestInit.next).toBeDefined();
		expect(requestInit.next.revalidate).toBe(60);

		// 기본 설정과 요청별 설정 조합 테스트
		const cachedApi = createFetch({
			baseURL: "https://api.example.com",
			cache: "force-cache",
		});

		await cachedApi.get("/data", { cache: "no-store" });
		expect(mockFetch.mock.calls[4][1].cache).toBe("no-store");
	});

	it("next 옵션 상속 테스트", async () => {
		// 응답 모킹
		mockFetch.mockImplementation(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({ data: "success" }),
			}),
		);

		// 기본 설정에 next 옵션을 포함
		const apiWithNextDefaults = createFetch({
			baseURL: "https://api.example.com",
			next: { revalidate: 30, tags: ["default"] },
		});

		await apiWithNextDefaults.get("/data");
		expect(mockFetch.mock.calls[0][1].next).toBeDefined();
		expect(mockFetch.mock.calls[0][1].next.revalidate).toBe(30);
		expect(mockFetch.mock.calls[0][1].next.tags).toEqual(["default"]);

		// 요청별 설정으로 next 속성 덮어쓰기
		await apiWithNextDefaults.get("/data", {
			next: { revalidate: 60, tags: ["custom"] },
		});
		expect(mockFetch.mock.calls[1][1].next.revalidate).toBe(60);
		expect(mockFetch.mock.calls[1][1].next.tags).toEqual(["custom"]);

		// 요청별 설정으로 next 속성 부분 덮어쓰기
		await apiWithNextDefaults.get("/data", {
			next: { revalidate: 120 },
		});
		expect(mockFetch.mock.calls[2][1].next.revalidate).toBe(120);
		expect(mockFetch.mock.calls[2][1].next.tags).toEqual(["default"]);
	});

	it("next 옵션의 태그 기능 테스트", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ data: "tagged-data" }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// tags 옵션 테스트
		await api.get("/products", {
			next: { tags: ["products"] },
		});

		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.next.tags).toEqual(["products"]);
	});

	it("여러 next 옵션 조합 테스트", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ data: "combined-options" }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// revalidate와 tags 함께 사용
		await api.get("/dashboard", {
			next: { revalidate: 300, tags: ["dashboard", "user-data"] },
		});

		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.next.revalidate).toBe(300);
		expect(requestInit.next.tags).toEqual(["dashboard", "user-data"]);
	});
});
