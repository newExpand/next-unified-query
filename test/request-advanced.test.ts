import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { createFetch, FetchError, ContentType, ResponseType } from "../src";
import { z } from "zod";

describe("next-type-fetch: 요청 고급 테스트", () => {
	// 테스트용 fetch 모킹
	let mockFetch: ReturnType<typeof vi.fn>;
	const originalFetch = global.fetch;

	beforeEach(() => {
		// fetch 모킹
		mockFetch = vi.fn();
		global.fetch = mockFetch;
	});

	afterEach(() => {
		// 원래 fetch 복원
		global.fetch = originalFetch;
	});

	it("다양한 컨텐츠 타입 처리 - HTML", async () => {
		// HTML 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "text/html",
			}),
			text: async () => "<html><body><h1>Hello</h1></body></html>",
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// HTML 컨텐츠로 POST 요청
		await api.post("/html-endpoint", "<div>Some HTML content</div>", {
			contentType: ContentType.HTML,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe(ContentType.HTML);
		expect(requestInit.body).toBe("<div>Some HTML content</div>");
	});

	it("다양한 컨텐츠 타입 처리 - XML", async () => {
		// XML 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/xml",
			}),
			text: async () => "<root><item>XML Data</item></root>",
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// XML 컨텐츠로 POST 요청
		await api.post("/xml-endpoint", "<root><item>XML Data</item></root>", {
			contentType: ContentType.XML,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe(ContentType.XML);
		expect(requestInit.body).toBe("<root><item>XML Data</item></root>");
	});

	it("스키마 검증 실패 시 에러 처리", async () => {
		// 유효하지 않은 응답 데이터로 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({
				// name은 필수지만 누락됨, age는 문자열이 아닌 숫자
				age: 30,
			}),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 스키마 정의
		const userSchema = z.object({
			name: z.string(),
			age: z.number().optional(),
		});

		// 스키마 검증 실패 테스트
		try {
			await api.get("/user", { schema: userSchema });
			// 여기에 도달하면 안됨
			expect(true).toBe(false); // 강제 실패
		} catch (error) {
			expect(error).toBeInstanceOf(FetchError);
			expect((error as FetchError).code).toBe("ERR_VALIDATION");
			expect((error as FetchError).response?.status).toBe(200);
			expect((error as FetchError).response?.data).toEqual({ age: 30 });
		}
	});

	it("커스텀 responseType으로 Blob 응답 처리", async () => {
		// Blob 데이터로 모킹
		const blobData = new Blob(["test blob data"], {
			type: "application/octet-stream",
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/octet-stream",
			}),
			blob: async () => blobData,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// Blob 응답 타입으로 요청
		const response = await api.get("/binary-data", {
			responseType: ResponseType.BLOB,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(response.data).toBe(blobData);
	});

	it("커스텀 responseType으로 ArrayBuffer 응답 처리", async () => {
		// ArrayBuffer 데이터로 모킹
		const buffer = new ArrayBuffer(8);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/octet-stream",
			}),
			arrayBuffer: async () => buffer,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// ArrayBuffer 응답 타입으로 요청
		const response = await api.get("/binary-data", {
			responseType: ResponseType.ARRAY_BUFFER,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(response.data).toBe(buffer);
	});

	it("URL SearchParams를 POST 요청 데이터로 사용", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// URLSearchParams 사용
		const params = new URLSearchParams();
		params.append("username", "testuser");
		params.append("password", "testpass123");

		await api.post("/login", params, {
			contentType: ContentType.FORM,
			headers: {
				"Content-Type": ContentType.FORM,
			},
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.body).toBe(params);
		expect(requestInit.headers["Content-Type"]).toBe(ContentType.FORM);
	});

	it("일반 객체를 URL-encoded 폼 데이터로 변환", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });

		// 일반 객체 사용
		const formData = {
			username: "testuser",
			password: "testpass123",
			remember: true,
		};

		await api.post("/login", formData, {
			contentType: ContentType.FORM,
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const requestInit = mockFetch.mock.calls[0][1];

		// URLSearchParams 객체가 생성되었는지 확인
		expect(requestInit.body instanceof URLSearchParams).toBe(true);

		// 폼 데이터 내용 확인
		const formBody = requestInit.body as URLSearchParams;
		expect(formBody.get("username")).toBe("testuser");
		expect(formBody.get("password")).toBe("testpass123");
		expect(formBody.get("remember")).toBe("true");
	});
});
