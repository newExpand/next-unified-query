import { isFunction } from "es-toolkit";
import { FetchError, type NextTypeResponse } from "../types";
import { z } from "zod/v4";
import type { $ZodError, $ZodIssue } from "zod/v4/core";

/**
 * 객체가 FetchError인지 확인합니다.
 * @param error 검사할 객체
 * @returns FetchError 여부
 *
 * @example
 * try {
 *   const response = await api.get('/api/users');
 *   // 성공 처리
 * } catch (error) {
 *   if (isFetchError(error)) {
 *     console.error('API 에러:', error.message, error.code);
 *   }
 * }
 */
export function isFetchError(error: unknown): error is FetchError {
	return error instanceof FetchError;
}

/**
 * 에러가 검증 에러인지 확인합니다.
 * @param error 검사할 에러
 * @returns 검증 에러 여부
 *
 * @example
 * try {
 *   const response = await api.post('/api/users', userData);
 * } catch (error) {
 *   if (isValidationError(error)) {
 *     const validationErrors = getValidationErrors(error);
 *     console.error('검증 실패:', validationErrors);
 *   }
 * }
 */
export function isValidationError(error: unknown): error is FetchError & { cause: $ZodError<any> } {
	return isFetchError(error) && error.code === "ERR_VALIDATION" && error.cause instanceof z.ZodError;
}

/**
 * 검증 에러에서 상세 메시지를 추출합니다.
 * @param error 검증 에러
 * @returns 검증 에러 메시지 배열
 *
 * @example
 * if (isValidationError(error)) {
 *   const errors = getValidationErrors(error);
 *   errors.forEach(err => {
 *     console.log(`${err.path}: ${err.message}`);
 *   });
 * }
 */
export function getValidationErrors(error: FetchError): Array<{ path: string; message: string }> {
	if (!isValidationError(error)) {
		return [];
	}

	return error.cause.issues.map((issue: $ZodIssue) => ({
		path: issue.path.join("."),
		message: issue.message,
	}));
}

/**
 * 에러가 특정 에러 코드를 가지고 있는지 확인합니다.
 * @param error 검사할 에러
 * @param code 확인할 에러 코드
 * @returns 일치 여부
 *
 * @example
 * if (hasErrorCode(error, 'ERR_CANCELED')) {
 *   console.log('요청이 취소되었습니다.');
 * }
 */
export function hasErrorCode(error: unknown, code: string): boolean {
	return isFetchError(error) && error.code === code;
}

/**
 * FetchError 에러 코드 상수
 */
export const ErrorCode = {
	/** 네트워크 에러 */
	NETWORK: "ERR_NETWORK",
	/** 요청 취소됨 */
	CANCELED: "ERR_CANCELED",
	/** 요청 타임아웃 */
	TIMEOUT: "ERR_TIMEOUT",
	/** 서버 응답 에러 (4xx, 5xx) */
	BAD_RESPONSE: "ERR_BAD_RESPONSE",
	/** 데이터 검증 실패 */
	VALIDATION: "ERR_VALIDATION",
	/** 알 수 없는 검증 오류 */
	VALIDATION_UNKNOWN: "ERR_VALIDATION_UNKNOWN",
	/** 알 수 없는 에러 */
	UNKNOWN: "ERR_UNKNOWN",
} as const;

/**
 * FetchError 에러 코드 타입
 */
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 에러를 처리하는 유틸리티 함수
 * @param error 처리할 에러
 * @param handlers 에러 코드별 핸들러
 * @returns 처리 결과 (핸들러 함수의 반환값)
 *
 * @example
 * try {
 *   const response = await api.get('/api/users');
 *   return response.data;
 * } catch (error) {
 *   return handleFetchError(error, {
 *     [ErrorCode.NETWORK]: () => '네트워크 연결을 확인해주세요.',
 *     [ErrorCode.TIMEOUT]: () => '요청 시간이 초과되었습니다.',
 *     [ErrorCode.CANCELED]: () => '요청이 취소되었습니다.',
 *     default: (err) => `오류가 발생했습니다: ${err.message}`,
 *   });
 * }
 */
export function handleFetchError<T>(
	error: unknown,
	handlers: {
		[code in ErrorCodeType]?: (error: FetchError) => T;
	} & {
		default?: (error: unknown) => T;
	},
): T {
	if (isFetchError(error) && error.code) {
		const errorCode = error.code as ErrorCodeType;
		const handler = handlers[errorCode];
		if (handler) {
			return handler(error);
		}
	}

	if (handlers.default) {
		return handlers.default(error);
	}

	// 핸들러가 없으면 에러를 다시 throw
	throw error;
}

/**
 * HTTP 상태 코드에 따라 에러를 처리합니다.
 * @param error 처리할 에러
 * @param handlers HTTP 상태 코드별 핸들러
 * @returns 처리 결과 (핸들러 함수의 반환값)
 *
 * @example
 * try {
 *   const response = await api.get('/api/users');
 *   return response.data;
 * } catch (error) {
 *   return handleHttpError(error, {
 *     400: () => '잘못된 요청입니다.',
 *     401: () => '인증이 필요합니다.',
 *     404: () => '리소스를 찾을 수 없습니다.',
 *     default: () => '서버 오류가 발생했습니다.',
 *   });
 * }
 */
export function handleHttpError<T>(
	error: unknown,
	handlers: {
		[status: number]: (error: FetchError) => T;
		default?: (error: unknown) => T;
	},
): T {
	if (isFetchError(error) && error.response && isFunction(handlers[error.response.status])) {
		return handlers[error.response.status](error);
	}

	if (handlers.default) {
		return handlers.default(error);
	}

	// 핸들러가 없으면 에러를 다시 throw
	throw error;
}

/**
 * 에러를 NextTypeResponse 형태로 변환합니다.
 * 인터셉터에서 에러를 응답으로 변환할 때 유용하게 사용할 수 있습니다.
 * @param error 변환할 에러
 * @param data 응답 데이터
 * @returns NextTypeResponse 객체
 *
 * @example
 * // 인터셉터에서 사용 예시
 * api.interceptors.error.use((error) => {
 *   if (hasErrorCode(error, ErrorCode.VALIDATION)) {
 *     return errorToResponse(error, {
 *       validationError: true,
 *       fields: error.response?.data
 *     });
 *   }
 *   throw error;
 * });
 */
export function errorToResponse<T>(error: FetchError, data: T): NextTypeResponse<T> {
	return {
		data,
		status: error.response?.status || 500,
		statusText: error.response?.statusText || error.message,
		headers: error.response?.headers || new Headers(),
		config: error.config,
		request: error.request,
	};
}
