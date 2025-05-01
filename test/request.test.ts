import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: HTTP 요청", () => {
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

	it("GET 요청 실행", async () => {
		const mockResponse = {
			id: 1,
			name: "Test User",
			email: "test@example.com",
		};

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
		const result = await api.get("/users/1");

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users/1");
		expect(result.data).toEqual(mockResponse);
		expect(result.error).toBeNull();
		expect(result.status).toBe(200);
	});

	it("POST 요청과 데이터 전송", async () => {
		const requestData = { name: "New User", email: "new@example.com" };
		const mockResponse = { id: 2, ...requestData };

		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => mockResponse,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.post("/users", requestData);

		expect(mockFetch).toHaveBeenCalledTimes(1);

		// 첫 번째 인자는 URL
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users");

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("POST");
		expect(requestInit.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(requestInit.body)).toEqual(requestData);

		// 응답 확인
		expect(result.data).toEqual(mockResponse);
		expect(result.error).toBeNull();
		expect(result.status).toBe(201);
	});

	it("PUT 요청 테스트", async () => {
		const requestData = { name: "Updated User" };
		const mockResponse = { id: 1, ...requestData };

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
		const result = await api.put("/users/1", requestData);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users/1");

		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("PUT");
		expect(JSON.parse(requestInit.body)).toEqual(requestData);

		expect(result.data).toEqual(mockResponse);
	});

	it("PATCH 요청 테스트", async () => {
		const requestData = { name: "Patched Name" };
		const mockResponse = {
			id: 1,
			name: "Patched Name",
			email: "test@example.com",
		};

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
		const result = await api.patch("/users/1", requestData);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users/1");

		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("PATCH");
		expect(JSON.parse(requestInit.body)).toEqual(requestData);

		expect(result.data).toEqual(mockResponse);
	});

	it("DELETE 요청 테스트", async () => {
		const mockResponse = { success: true };

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
		const result = await api.delete("/users/1");

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/users/1");

		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("DELETE");

		expect(result.data).toEqual(mockResponse);
	});

	it("쿼리 파라미터 처리", async () => {
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
		await api.get("/search", {
			params: {
				query: "test search",
				page: 1,
				limit: 10,
				includeDeleted: false,
				tags: undefined, // 무시되어야 함
				category: null, // 무시되어야 함
			},
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const url = mockFetch.mock.calls[0][0];

		// URL에 쿼리 파라미터가 올바르게 포함되었는지 확인
		// URLSearchParams는 공백을 '+'로 인코딩
		expect(url).toContain("query=test+search");
		expect(url).toContain("page=1");
		expect(url).toContain("limit=10");
		expect(url).toContain("includeDeleted=false");
		expect(url).not.toContain("tags=");
		expect(url).not.toContain("category=");
	});

	it("FormData로 데이터 전송", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const formData = new FormData();
		formData.append("name", "Test User");
		formData.append("avatar", new Blob(["dummy file content"], { type: "image/png" }), "avatar.png");

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.post("/upload", formData);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/upload");

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("POST");

		// 직접 비교 대신 instanceof를 사용하여 타입 확인
		expect(requestInit.body instanceof FormData).toBe(true);

		// Content-Type 헤더가 자동으로 설정되지 않아야 함 (브라우저가 자동으로 설정)
		expect(requestInit.headers["Content-Type"]).toBeUndefined();

		expect(result.data).toEqual({ success: true });
		expect(result.error).toBeNull();
		expect(result.status).toBe(201);
	});

	it("URL 인코딩된 폼 데이터 전송", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const urlSearchParams = new URLSearchParams();
		urlSearchParams.append("username", "testuser");
		urlSearchParams.append("password", "password123");

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.post("/login", urlSearchParams, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/login");

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.method).toBe("POST");
		expect(requestInit.body).toBe(urlSearchParams); // URLSearchParams가 그대로 전달되어야 함
		expect(requestInit.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");

		expect(result.data).toEqual({ success: true });
		expect(result.error).toBeNull();
		expect(result.status).toBe(200);
	});
});
