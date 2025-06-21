import { describe, expect, it } from "vitest";
import {
	isFetchError,
	hasErrorCode,
	ErrorCode,
	handleFetchError,
	handleHttpError,
	errorToResponse,
	FetchError,
	type RequestConfig,
} from "../src";

describe("next-type-fetch: 에러 유틸리티", () => {
	// 테스트용 RequestConfig 생성
	const createMockConfig = (): RequestConfig => ({
		url: "/api/test",
		method: "GET",
		baseURL: "https://api.example.com",
	});

	// 테스트용 FetchError 생성
	const createMockError = (message: string, code: string, status?: number, data?: unknown): FetchError => {
		const config = createMockConfig();
		const error = new FetchError(message, config, code);

		if (status) {
			const mockResponse = new Response(JSON.stringify(data), {
				status,
				statusText: message,
			});

			error.response = {
				data,
				status,
				statusText: message,
				headers: new Headers(),
			};
		}

		return error;
	};

	it("isFetchError 함수: 객체가 FetchError인지 확인", () => {
		// FetchError 인스턴스
		const fetchError = createMockError("테스트 에러", ErrorCode.UNKNOWN);
		expect(isFetchError(fetchError)).toBe(true);

		// 다른 에러 인스턴스
		const otherError = new Error("일반 에러");
		expect(isFetchError(otherError)).toBe(false);

		// null 및 undefined
		expect(isFetchError(null)).toBe(false);
		expect(isFetchError(undefined)).toBe(false);

		// 일반 객체
		expect(isFetchError({ message: "가짜 에러" })).toBe(false);
	});

	it("hasErrorCode 함수: 에러가 특정 코드를 가지고 있는지 확인", () => {
		// 네트워크 에러
		const networkError = createMockError("네트워크 에러", ErrorCode.NETWORK);
		expect(hasErrorCode(networkError, ErrorCode.NETWORK)).toBe(true);
		expect(hasErrorCode(networkError, ErrorCode.TIMEOUT)).toBe(false);

		// 일반 에러
		const normalError = new Error("일반 에러");
		expect(hasErrorCode(normalError, ErrorCode.NETWORK)).toBe(false);

		// 코드가 없는 FetchError
		const noCodeError = createMockError("코드 없음", "");
		expect(hasErrorCode(noCodeError, ErrorCode.NETWORK)).toBe(false);
	});

	it("handleFetchError 함수: 에러 코드별 처리", () => {
		// 네트워크 에러
		const networkError = createMockError("네트워크 에러", ErrorCode.NETWORK);

		// 타임아웃 에러
		const timeoutError = createMockError("타임아웃", ErrorCode.TIMEOUT);

		// 취소 에러
		const canceledError = createMockError("취소됨", ErrorCode.CANCELED);

		// 핸들러 함수
		const result = handleFetchError(networkError, {
			[ErrorCode.NETWORK]: () => "네트워크 문제 발생",
			[ErrorCode.TIMEOUT]: () => "요청 시간 초과",
			[ErrorCode.CANCELED]: () => "요청 취소됨",
			default: (err) => `기타 오류: ${(err as Error).message}`,
		});

		expect(result).toBe("네트워크 문제 발생");

		// 타임아웃 에러 처리
		const timeoutResult = handleFetchError(timeoutError, {
			[ErrorCode.NETWORK]: () => "네트워크 문제 발생",
			[ErrorCode.TIMEOUT]: () => "요청 시간 초과",
			default: () => "기타 오류",
		});

		expect(timeoutResult).toBe("요청 시간 초과");

		// 기본 핸들러 사용
		const unknownError = createMockError("알 수 없는 에러", "UNKNOWN_CODE");
		const defaultResult = handleFetchError(unknownError, {
			[ErrorCode.NETWORK]: () => "네트워크 문제 발생",
			[ErrorCode.TIMEOUT]: () => "요청 시간 초과",
			default: (err) => `기타 오류: ${(err as FetchError).message}`,
		});

		expect(defaultResult).toBe("기타 오류: 알 수 없는 에러");

		// 일반 에러 처리
		const normalError = new Error("일반 에러");
		const normalResult = handleFetchError(normalError, {
			[ErrorCode.NETWORK]: () => "네트워크 문제 발생",
			default: (err) => `기타 오류: ${(err as Error).message}`,
		});

		expect(normalResult).toBe("기타 오류: 일반 에러");

		// 핸들러가 없는 경우 예외 발생
		let wasErrorThrown = false;
		try {
			handleFetchError(networkError, {
				[ErrorCode.TIMEOUT]: () => "요청 시간 초과",
			});
			// 여기에 도달하면 안됨
		} catch (error) {
			wasErrorThrown = true;
			expect(error).toBe(networkError);
		}
		expect(wasErrorThrown).toBe(true);
	});

	it("handleHttpError 함수: HTTP 상태 코드별 처리", () => {
		// 404 에러
		const notFoundError = createMockError("Not Found", ErrorCode.BAD_RESPONSE, 404, {
			message: "리소스를 찾을 수 없습니다",
		});

		// 401 에러
		const unauthorizedError = createMockError("Unauthorized", ErrorCode.BAD_RESPONSE, 401, {
			message: "인증이 필요합니다",
		});

		// 500 에러
		const serverError = createMockError("Server Error", ErrorCode.BAD_RESPONSE, 500, { message: "서버 오류" });

		// 핸들러 함수
		const result = handleHttpError(notFoundError, {
			404: () => "페이지를 찾을 수 없습니다",
			401: () => "로그인이 필요합니다",
			500: () => "서버 오류가 발생했습니다",
			default: () => "알 수 없는 오류",
		});

		expect(result).toBe("페이지를 찾을 수 없습니다");

		// 401 에러 처리
		const authResult = handleHttpError(unauthorizedError, {
			404: () => "페이지를 찾을 수 없습니다",
			401: () => "로그인이 필요합니다",
			default: () => "알 수 없는 오류",
		});

		expect(authResult).toBe("로그인이 필요합니다");

		// 기본 핸들러 사용
		const unknownStatusError = createMockError("Bad Request", ErrorCode.BAD_RESPONSE, 400, { message: "잘못된 요청" });
		const defaultResult = handleHttpError(unknownStatusError, {
			404: () => "페이지를 찾을 수 없습니다",
			401: () => "로그인이 필요합니다",
			default: () => "요청에 문제가 있습니다",
		});

		expect(defaultResult).toBe("요청에 문제가 있습니다");

		// 일반 에러 처리
		const normalError = new Error("일반 에러");
		const normalResult = handleHttpError(normalError, {
			404: () => "페이지를 찾을 수 없습니다",
			default: () => "요청에 문제가 있습니다",
		});

		expect(normalResult).toBe("요청에 문제가 있습니다");

		// 핸들러가 없는 경우 예외 발생
		let wasErrorThrown = false;
		try {
			handleHttpError(notFoundError, {
				401: () => "로그인이 필요합니다",
			});
			// 여기에 도달하면 안됨
		} catch (error) {
			wasErrorThrown = true;
			expect(error).toBe(notFoundError);
		}
		expect(wasErrorThrown).toBe(true);
	});

	it("errorToResponse 함수: 에러를 응답으로 변환", () => {
		// 응답이 있는 에러
		const errorWithResponse = createMockError("Not Found", ErrorCode.BAD_RESPONSE, 404, {
			message: "리소스를 찾을 수 없습니다",
		});

		// 응답이 없는 에러
		const errorWithoutResponse = createMockError("Network Error", ErrorCode.NETWORK);

		// 에러를 응답으로 변환
		const customData = { converted: true, errorType: "not_found" };
		const response = errorToResponse(errorWithResponse, customData);

		// 변환된 응답 확인
		expect(response.data).toBe(customData);
		expect(response.status).toBe(404);
		expect(response.statusText).toBe("Not Found");
		expect(response.headers).toBeDefined();
		expect(response.config).toBe(errorWithResponse.config);

		// 응답이 없는 에러 변환
		const fallbackResponse = errorToResponse(errorWithoutResponse, {
			error: true,
		});

		// 기본값 확인
		expect(fallbackResponse.status).toBe(500);
		expect(fallbackResponse.statusText).toBe("Network Error");
		expect(fallbackResponse.headers).toBeInstanceOf(Headers);
	});
});
