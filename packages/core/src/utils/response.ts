import { FetchError, type NextTypeResponse, type RequestConfig } from "../types";

/**
 * 응답 객체에서 데이터를 추출합니다.
 * @internal
 * @param response NextTypeResponse 객체
 * @returns 데이터
 */
export function unwrap<T>(response: NextTypeResponse<T>): T {
	return response.data;
}

/**
 * 응답 객체에서 상태 코드를 추출합니다.
 * @param response NextTypeResponse 객체
 * @returns HTTP 상태 코드
 */
export function getStatus<T>(response: NextTypeResponse<T>): number {
	return response.status;
}

/**
 * 응답 객체에서 헤더를 추출합니다.
 * @param response NextTypeResponse 객체
 * @returns 응답 헤더
 */
export function getHeaders<T>(response: NextTypeResponse<T>): Headers {
	return response.headers;
}

/**
 * 응답 객체가 특정 상태 코드인지 확인합니다.
 * @param response NextTypeResponse 객체
 * @param code HTTP 상태 코드
 * @returns 상태 코드 일치 여부
 */
export function hasStatus<T>(response: NextTypeResponse<T>, code: number): boolean {
	return response.status === code;
}

/**
 * HTTP 에러를 생성합니다.
 * @param message 에러 메시지
 * @param config 요청 설정
 * @param code 에러 코드
 * @param response 응답 객체 (선택적)
 * @param data 응답 데이터 (선택적)
 * @returns FetchError 인스턴스
 */
export function createError<TErrorData = unknown>(
	message: string,
	config: RequestConfig,
	code = "ERR_UNKNOWN",
	response?: Response,
	data?: TErrorData,
): FetchError<TErrorData> {
	return new FetchError(message, config, code, undefined, response, data);
}
