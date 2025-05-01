import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentType, ResponseType } from "../src/types/index.js";
import { createFetch } from "../src/index.js";

describe("next-type-fetch: 컨텐츠 타입 & 응답 타입", () => {
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

	it("JSON 컨텐츠 타입 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const data = { name: "홍길동", age: 30 };
		await api.post("/users", data, {
			contentType: ContentType.JSON,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(requestInit.body as string)).toEqual(data);
	});

	it("URL 인코딩된 폼 데이터 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const formData = {
			username: "user123",
			password: "pass123",
		};

		await api.post("/login", formData, {
			contentType: ContentType.FORM,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");

		// URLSearchParams로 변환되었는지 확인
		expect(requestInit.body instanceof URLSearchParams).toBe(true);
		const params = requestInit.body as URLSearchParams;
		expect(params.get("username")).toBe("user123");
		expect(params.get("password")).toBe("pass123");
	});

	it("텍스트 컨텐츠 타입 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "text/plain",
			}),
			text: async () => "Success",
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		await api.post("/text-endpoint", "Hello, World!", {
			contentType: ContentType.TEXT,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("text/plain");
		expect(requestInit.body).toBe("Hello, World!");
	});

	it("XML 컨텐츠 타입 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/xml",
			}),
			text: async () => "<response><status>success</status></response>",
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const xmlData = "<request><name>John</name><age>30</age></request>";
		await api.post("/xml-endpoint", xmlData, {
			contentType: ContentType.XML,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("application/xml");
		expect(requestInit.body).toBe(xmlData);
	});

	it("HTML 컨텐츠 타입 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "text/html",
			}),
			text: async () => "<html><body>Success</body></html>",
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const htmlData = "<div>Hello, World!</div>";
		await api.post("/html-endpoint", htmlData, {
			contentType: ContentType.HTML,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("text/html");
		expect(requestInit.body).toBe(htmlData);
	});

	it("multipart/form-data 처리", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const formData = new FormData();
		formData.append("username", "user123");
		formData.append("file", new Blob(["file content"]), "test.txt");

		await api.post("/upload", formData, {
			contentType: ContentType.MULTIPART,
		});

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		// multipart/form-data는 자동으로 boundary가 설정되므로 Content-Type 헤더가 직접 설정되지 않음
		expect(requestInit.headers["Content-Type"]).toBeUndefined();
		expect(requestInit.body).toBe(formData);
	});

	it("JSON 응답 타입 처리", async () => {
		const jsonData = { id: 1, name: "홍길동" };
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => jsonData,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.get("/users/1", {
			responseType: ResponseType.JSON,
		});

		expect(result.data).toEqual(jsonData);
	});

	it("텍스트 응답 타입 처리", async () => {
		const textData = "Hello, World!";
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "text/plain",
			}),
			text: async () => textData,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.get("/text-endpoint", {
			responseType: ResponseType.TEXT,
		});

		expect(result.data).toBe(textData);
	});

	it("Blob 응답 타입 처리", async () => {
		const blobData = new Blob(["binary data"], {
			type: "application/octet-stream",
		});

		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/octet-stream",
			}),
			blob: async () => blobData,
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const result = await api.get("/binary-endpoint", {
			responseType: ResponseType.BLOB,
		});

		expect(result.data).toBe(blobData);
	});

	it("JSON Content-Type 자동 감지", async () => {
		// 응답 모킹
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
			}),
			json: async () => ({ success: true }),
		});

		const api = createFetch({ baseURL: "https://api.example.com" });
		const data = { name: "홍길동", age: 30 };
		await api.post("/users", data); // contentType 명시하지 않음

		// 두 번째 인자는 요청 옵션
		const requestInit = mockFetch.mock.calls[0][1];
		expect(requestInit.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(requestInit.body as string)).toEqual(data);
	});
});
