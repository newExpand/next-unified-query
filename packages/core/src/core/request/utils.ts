import { isFunction, isNumber, isObject } from "es-toolkit/compat";
import type { RequestConfig, NextTypeResponse, FetchError } from "../../types";
import { ResponseType } from "../../types";
import type { InterceptorsType, RetrySettings } from "./types";

/**
 * Retry 설정 처리 헬퍼 함수
 */
export function createRetrySettings(retryConfig: RequestConfig["retry"]): RetrySettings {
	const defaultBackoff = (count: number) => Math.min(1000 * 2 ** (count - 1), 10000);

	if (isNumber(retryConfig)) {
		return {
			maxRetries: retryConfig,
			retryStatusCodes: [],
			retryBackoff: defaultBackoff,
		};
	}

	if (retryConfig && isObject(retryConfig)) {
		let retryBackoff = defaultBackoff;

		if (retryConfig.backoff === "linear") {
			retryBackoff = (count) => 1000 * count;
		} else if (retryConfig.backoff === "exponential") {
			retryBackoff = (count) => Math.min(1000 * 2 ** (count - 1), 10000);
		} else if (isFunction(retryConfig.backoff)) {
			retryBackoff = retryConfig.backoff;
		}

		return {
			maxRetries: retryConfig.limit,
			retryStatusCodes: retryConfig.statusCodes || [],
			retryBackoff,
		};
	}

	return {
		maxRetries: 0,
		retryStatusCodes: [],
		retryBackoff: defaultBackoff,
	};
}

/**
 * AbortSignal 설정 헬퍼 함수
 */
export function setupAbortSignal(signal: AbortSignal | undefined, onAbort: () => void): void {
	if (!signal) return;

	if (signal.aborted) {
		onAbort();
	} else {
		signal.addEventListener("abort", onAbort);
	}
}

/**
 * RequestInit 객체 생성 헬퍼 함수
 */
export function createRequestInit(requestConfig: RequestConfig, abortController: AbortController): RequestInit {
	const {
		method = "GET",
		headers = {},
		cache,
		credentials,
		integrity,
		keepalive,
		mode,
		redirect,
		referrer,
		referrerPolicy,
		next,
	} = requestConfig;

	const requestInit: RequestInit = {
		method,
		headers: headers as Record<string, string>,
		signal: abortController.signal,
		cache,
		credentials,
		integrity,
		keepalive,
		mode,
		redirect,
		referrer,
		referrerPolicy,
	};

	// Next.js의 next 옵션이 있으면 RequestInit에 추가
	if (next) {
		(requestInit as RequestInit & { next?: typeof next }).next = next;
	}

	return requestInit;
}

/**
 * 응답 타입에 따라 응답 데이터를 처리합니다.
 */
export async function processResponseByType(
	response: Response,
	responseType: ResponseType,
	contentTypeHeader: string,
	parseJSON = true,
): Promise<unknown> {
	// 응답 타입 결정
	const effectiveResponseType =
		responseType ||
		(contentTypeHeader.includes("application/json") && parseJSON !== false ? ResponseType.JSON : ResponseType.TEXT);

	// HEAD나 OPTIONS 요청과 같이 응답 본문이 없는 경우를 위한 안전 검사
	const isEmptyResponse = response.status === 204 || response.headers.get("content-length") === "0";

	// 응답 메서드 안전 검사 함수
	const safeCall = async <T>(method: "json" | "text" | "blob" | "arrayBuffer", fallback: T): Promise<T> => {
		if (!response[method] || !isFunction(response[method])) {
			// 모킹 환경 감지: 테스트 시 response는 모킹된 객체일 수 있음
			// 테스트에서는 모킹된 응답 객체를 그대로 사용
			if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
				// 테스트 환경에서 mocking된 객체라면 해당 메서드를 직접 호출
				try {
					if (response[method] && isFunction(response[method])) {
						// 타입 단언을 사용하여 타입 오류 해결
						return await (response[method] as () => Promise<T>)();
					}
				} catch (e) {
					// 테스트 환경에서 오류 발생 시 fallback 반환
				}
			}
			return fallback;
		}

		try {
			// 타입 단언을 사용하여 타입 오류 해결
			return await (response[method] as () => Promise<T>)();
		} catch (e) {
			console.warn(`Failed to process response with ${method}:`, e);
			return fallback;
		}
	};

	switch (effectiveResponseType) {
		case ResponseType.JSON:
			// 빈 응답 본문이면 빈 객체 반환
			if (isEmptyResponse) {
				return {};
			}

			try {
				return await response.json();
			} catch (e) {
				// JSON 파싱 실패 시 텍스트로 대체
				return await safeCall("text", "");
			}

		case ResponseType.BLOB:
			if (isEmptyResponse) {
				return new Blob();
			}
			return await safeCall("blob", new Blob());

		case ResponseType.ARRAY_BUFFER:
			if (isEmptyResponse) {
				return new ArrayBuffer(0);
			}
			return await safeCall("arrayBuffer", new ArrayBuffer(0));

		case ResponseType.RAW:
			// Response 객체 자체를 반환
			return response;

		default:
			// 기본값은 텍스트
			if (isEmptyResponse) {
				return "";
			}
			return await safeCall("text", "");
	}
}

/**
 * 재시도 실행 (공통 로직)
 */
export async function executeRetry<T>(
	retryBackoff: (count: number) => number,
	retryCount: number,
	performRequest: () => Promise<NextTypeResponse<T>>,
): Promise<NextTypeResponse<T>> {
	// 재시도 간격 계산 및 대기
	const delay = retryBackoff(retryCount);
	await new Promise((resolve) => setTimeout(resolve, delay));

	// 재시도 실행
	return performRequest();
}

/**
 * 에러 인터셉터 처리 (공통 로직)
 */
export async function processErrorWithInterceptor<T, TErrorData = any>(
	error: FetchError<TErrorData>,
	interceptors: InterceptorsType,
): Promise<NextTypeResponse<T> | never> {
	const processedError = await interceptors.error.run(error);

	// 만약 인터셉터가 NextTypeResponse를 반환하면 정상 응답으로 처리
	if ("data" in processedError && "status" in processedError) {
		return processedError as NextTypeResponse<T>;
	}

	throw processedError;
}