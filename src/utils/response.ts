import { HttpError, type ZodResponse } from "../types/index.js";

/**
 * ZodResponse 객체에서 데이터를 추출합니다.
 * 에러가 있으면 HttpError를 throw하고, 데이터가 있으면 반환합니다.
 * @param response ZodResponse 객체
 * @returns 데이터
 * @throws HttpError 에러가 있는 경우
 */
export function unwrap<T>(response: ZodResponse<T>): T {
  if (response.error) {
    throw new HttpError(
      response.error.message,
      response.status || 0,
      response.error.raw,
      response.headers
    );
  }

  return response.data as T;
}

/**
 * ZodResponse 객체에서 안전하게 데이터를 추출합니다.
 * 에러가 있어도 throw하지 않고 null을 반환합니다.
 * @param response ZodResponse 객체
 * @returns 데이터 또는 null
 */
export function safeUnwrap<T>(response: ZodResponse<T>): T | null {
  if (response.error) {
    return null;
  }

  return response.data as T;
}

/**
 * ZodResponse 객체에서 데이터를 추출하고, 없으면 기본값을 반환합니다.
 * @param response ZodResponse 객체
 * @param defaultValue 기본값
 * @returns 데이터 또는 기본값
 */
export function unwrapOr<T>(response: ZodResponse<T>, defaultValue: T): T {
  if (response.error) {
    return defaultValue;
  }

  return response.data as T;
}

/**
 * HTTP 응답 객체를 검사하여 성공인지 확인합니다.
 * @param response ZodResponse 객체
 * @returns 성공 여부
 */
export function isSuccess<T>(response: ZodResponse<T>): boolean {
  return response.error === null && response.data !== null;
}

/**
 * HTTP 응답 객체에서 상태 코드를 추출합니다.
 * @param response ZodResponse 객체
 * @returns HTTP 상태 코드 또는 0
 */
export function getStatus<T>(response: ZodResponse<T>): number {
  return response.status || 0;
}

/**
 * HTTP 에러를 생성합니다.
 * @param message 에러 메시지
 * @param status HTTP 상태 코드
 * @param data 원본 응답 데이터
 * @param headers 응답 헤더
 * @returns HttpError 인스턴스
 */
export function createHttpError(
  message: string,
  status = 0,
  data?: unknown,
  headers?: Headers
): HttpError {
  return new HttpError(message, status, data, headers);
}
