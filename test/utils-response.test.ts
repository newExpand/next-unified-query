import { describe, expect, it } from "vitest";
import {
	unwrap,
	getStatus,
	getHeaders,
	hasStatus,
	createError,
	FetchError,
	type AxiosLikeResponse,
	type RequestConfig,
} from "../src";

describe("next-type-fetch: 응답 유틸리티", () => {
	// 테스트용 응답 객체 생성
	const createMockResponse = <T>(data: T): AxiosLikeResponse<T> => {
		return {
			data,
			status: 200,
			statusText: "OK",
			headers: new Headers({
				"content-type": "application/json",
			}),
			config: {} as RequestConfig,
		};
	};

	it("unwrap 함수: 응답 객체에서 데이터 추출", () => {
		const testData = { id: 1, name: "Test User" };
		const response = createMockResponse(testData);

		// unwrap 함수 테스트
		const result = unwrap(response);

		expect(result).toEqual(testData);
		expect(result).toBe(response.data);
	});

	it("getStatus 함수: 응답 객체에서 상태 코드 추출", () => {
		const response = createMockResponse({ success: true });
		response.status = 201;

		// getStatus 함수 테스트
		const statusCode = getStatus(response);

		expect(statusCode).toBe(201);
	});

	it("getHeaders 함수: 응답 객체에서 헤더 추출", () => {
		const headers = new Headers({
			"content-type": "application/json",
			"x-custom-header": "test-value",
		});
		const response = createMockResponse({ success: true });
		response.headers = headers;

		// getHeaders 함수 테스트
		const extractedHeaders = getHeaders(response);

		expect(extractedHeaders).toBe(headers);
		expect(extractedHeaders.get("x-custom-header")).toBe("test-value");
	});

	it("hasStatus 함수: 응답 객체가 특정 상태 코드인지 확인", () => {
		const response = createMockResponse({ success: true });
		response.status = 201;

		// hasStatus 함수 테스트
		expect(hasStatus(response, 201)).toBe(true);
		expect(hasStatus(response, 200)).toBe(false);
		expect(hasStatus(response, 404)).toBe(false);
	});

	it("createError 함수: FetchError 인스턴스 생성", () => {
		const config: RequestConfig = {
			url: "/api/test",
			method: "GET",
			baseURL: "https://api.example.com",
		};

		// 기본 에러 생성
		const basicError = createError("테스트 에러", config);
		expect(basicError).toBeInstanceOf(FetchError);
		expect(basicError.message).toBe("테스트 에러");
		expect(basicError.config).toBe(config);
		expect(basicError.code).toBe("ERR_UNKNOWN");
		expect(basicError.response).toBeUndefined();

		// 커스텀 코드가 있는 에러 생성
		const customCodeError = createError("인증 에러", config, "ERR_AUTH");
		expect(customCodeError.code).toBe("ERR_AUTH");

		// 응답과 데이터가 포함된 에러 생성
		const mockResponse = new Response(JSON.stringify({ error: "Not Found" }), {
			status: 404,
			statusText: "Not Found",
		});
		const dataError = createError("리소스 없음", config, "ERR_NOT_FOUND", mockResponse, { error: "Not Found" });

		expect(dataError.message).toBe("리소스 없음");
		expect(dataError.code).toBe("ERR_NOT_FOUND");
		expect(dataError.response).toBeDefined();
		if (dataError.response) {
			expect(dataError.response.status).toBe(404);
			expect(dataError.response.data).toEqual({ error: "Not Found" });
		}
	});
});
