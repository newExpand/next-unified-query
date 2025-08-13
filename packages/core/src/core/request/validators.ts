import { isFunction, isNumber, isObject } from "es-toolkit/compat";
import { isNil } from "es-toolkit/predicate";
import type { RequestConfig, AuthRetryOption } from "../../types";
import { FetchError } from "../../types";

/**
 * 재시도 관련 검증 함수들
 */

/**
 * 재시도 가능 여부를 확인합니다
 */
export function canRetry(retryCount: number, maxRetries: number, isCanceled: boolean): boolean {
	return retryCount < maxRetries && !isCanceled;
}

/**
 * HTTP 상태 코드가 재시도 대상인지 확인합니다
 */
export function shouldRetryForHttpStatus(status: number, retryStatusCodes: number[]): boolean {
	// retryStatusCodes가 빈 배열이면 모든 상태 코드에 대해 재시도
	return retryStatusCodes.length === 0 || retryStatusCodes.includes(status);
}

/**
 * 네트워크 에러인지 확인합니다 (HTTP 에러가 아닌 경우)
 */
export function isNetworkError(error: unknown): boolean {
	return !(error instanceof FetchError);
}

/**
 * authRetry 관련 검증 함수들
 */

/**
 * authRetry 설정이 유효한지 확인합니다
 */
export function hasValidAuthRetry(authRetryOption: AuthRetryOption | undefined): authRetryOption is AuthRetryOption {
	return !isNil(authRetryOption) && isFunction(authRetryOption.handler);
}

/**
 * HTTP 상태 코드가 authRetry 대상인지 확인합니다
 */
export function shouldAuthRetryForStatus(status: number, authRetryOption: AuthRetryOption): boolean {
	const statusCodes = authRetryOption.statusCodes ?? [401];
	return statusCodes.includes(status);
}

/**
 * authRetry 조건을 만족하는지 확인합니다
 */
export function shouldExecuteAuthRetry(
	fetchError: FetchError<any>,
	config: RequestConfig,
	authRetryOption: AuthRetryOption,
): boolean {
	return !authRetryOption.shouldRetry || authRetryOption.shouldRetry(fetchError, config);
}

/**
 * authRetry 횟수 제한을 확인합니다
 */
export function canAuthRetry(authRetryCount: number, authRetryOption: AuthRetryOption): boolean {
	return authRetryCount < (authRetryOption.limit ?? 1);
}

/**
 * 취소 상태 확인 및 에러 발생 헬퍼 함수
 */
export function throwIfCanceled(isCanceled: boolean, config: RequestConfig): void {
	if (isCanceled) {
		throw new FetchError("Request was canceled", config, "ERR_CANCELED");
	}
}