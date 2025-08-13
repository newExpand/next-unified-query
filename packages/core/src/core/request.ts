import { z } from "zod/v4";
import type {
	NextTypeResponse,
	CancelablePromise,
	FetchConfig,
	RequestConfig,
} from "../types";
import { ContentType, FetchError, ResponseType } from "../types";
import { appendQueryParams, combineURLs, createTimeoutPromise, stringifyData } from "../utils";
import { isNil } from "es-toolkit/predicate";

// 분리된 모듈들 import
import { ContentTypeHandler } from "./request/content-type-handler";
import {
	canRetry,
	shouldRetryForHttpStatus,
	isNetworkError,
	hasValidAuthRetry,
	shouldAuthRetryForStatus,
	shouldExecuteAuthRetry,
	canAuthRetry,
	throwIfCanceled,
} from "./request/validators";
import type { InterceptorsType } from "./request/types";
import {
	createRetrySettings,
	setupAbortSignal,
	createRequestInit,
	processResponseByType,
	executeRetry,
	processErrorWithInterceptor,
} from "./request/utils"

/**
 * 요청 함수 생성
 * @param defaultConfig 기본 설정
 * @param interceptors 인터셉터
 * @returns 요청 함수
 */
export function createRequestFunction(defaultConfig: FetchConfig, interceptors: InterceptorsType) {
	// HTTP 레벨 중복 요청 방지를 위한 Map
	const activeRequests = new Map<string, Promise<NextTypeResponse<unknown>>>();
	/**
	 * 기본 요청 함수
	 */
	function request<T>(config: RequestConfig): CancelablePromise<NextTypeResponse<T>> {
		// 요청 중복 방지를 위한 키 생성
		// auth-retry 재시도 요청은 별도로 구분하기 위해 _authRetryCount 포함
		const requestKey = JSON.stringify({
			url: config.url,
			method: config.method || "GET",
			params: config.params,
			data: config.data,
			baseURL: config.baseURL,
			_authRetryCount: config._authRetryCount || 0,
		});

		// 이미 진행 중인 동일한 요청이 있는지 확인
		const existingRequest = activeRequests.get(requestKey);
		if (existingRequest) {
			return existingRequest as CancelablePromise<NextTypeResponse<T>>;
		}

		// 취소 상태 관리
		let isCanceled = false;
		let abortController = new AbortController();

		// 취소 메서드
		const cancel = () => {
			isCanceled = true;
			abortController.abort();
		};

		// 최대 재시도 횟수 및 설정 준비
		const { maxRetries, retryStatusCodes, retryBackoff } = createRetrySettings(config.retry);

		let retryCount = 0;
		let authRetryCount = config._authRetryCount || 0;
		const authRetryOption = config.authRetry || defaultConfig.authRetry;

		// 사용자 정의 AbortSignal이 있는 경우 즉시 확인
		setupAbortSignal(config.signal, () => {
			isCanceled = true;
			abortController.abort();
		});

		// 재시도 함수
		async function performRequest(): Promise<NextTypeResponse<T>> {
			try {
				// 이미 취소된 경우 에러 반환
				throwIfCanceled(isCanceled, config);

				// 스키마 추출 (요청 인터셉터 전에 제거)
				const { schema, ...restConfig } = config;

				// 요청 인터셉터 실행
				const requestConfig = await interceptors.request.run(restConfig);

				// URL 조합
				const url = combineURLs(requestConfig.baseURL, requestConfig.url);

				// URL에 쿼리 파라미터 추가
				const fullUrl = appendQueryParams(url, requestConfig.params);

				// 타임아웃 설정
				const timeoutResult = createTimeoutPromise(requestConfig.timeout);

				// 취소 상태 확인
				throwIfCanceled(isCanceled, config);

				// 요청 옵션 구성
				const { contentType, responseType, data, headers = {} } = requestConfig;
				const requestInit = createRequestInit(requestConfig, abortController);

				// data가 있으면 요청 본문에 추가
				if (!isNil(data)) {
					// Content-Type 결정 로직
					const effectiveContentType = contentType || (headers as Record<string, string>)["Content-Type"] || "";

					// 컨텐츠 타입이 제공되지 않았고 객체인 경우 기본값은 JSON
					if (ContentTypeHandler.shouldDefaultToJson(effectiveContentType, data)) {
						// 기본적으로 JSON으로 처리
						requestInit.body = stringifyData(data);
						requestInit.headers = {
							...(headers as Record<string, string>),
							"Content-Type": ContentType.JSON,
						};
					} else {
						// 컨텐츠 타입에 따라 요청 본문 데이터 처리
						const { body, headers: processedHeaders } = ContentTypeHandler.prepareRequestBody(
							data,
							effectiveContentType,
							headers as Record<string, string>,
						);

						requestInit.body = body;
						requestInit.headers = processedHeaders;
					}
				}

				// 이미 취소된 경우 fetch를 호출하지 않음
				throwIfCanceled(isCanceled, config);

				// 실제 fetch 요청 실행
				const fetchPromise = fetch(fullUrl, requestInit);

				// 타임아웃이 있으면 타임아웃 Promise와 함께 race
				const response = await (timeoutResult ? Promise.race([fetchPromise, timeoutResult.promise]) : fetchPromise);

				// 응답 처리
				const contentTypeHeader = response.headers.get("content-type") || "";

				// 응답 타입에 따라 응답 데이터 처리
				const responseData = await processResponseByType(
					response,
					responseType as ResponseType,
					contentTypeHeader,
					requestConfig.parseJSON,
				);

				// HTTP 에러 검사
				if (!response.ok) {
					// HTTP 에러 생성
					const fetchError = new FetchError(
						response.statusText || `HTTP error ${response.status}`,
						requestConfig,
						"ERR_BAD_RESPONSE",
						requestInit as unknown as Request,
						response,
						responseData,
					);

					// ⚠️ 중요: authRetry 로직을 가장 먼저 확인 (401 전용)
					if (hasValidAuthRetry(authRetryOption)) {
						const statusMatch = shouldAuthRetryForStatus(response.status, authRetryOption);
						const shouldRetryResult = shouldExecuteAuthRetry(fetchError, config, authRetryOption);

						if (statusMatch && shouldRetryResult) {
							authRetryCount = config._authRetryCount || 0;
							if (canAuthRetry(authRetryCount, authRetryOption)) {
								const shouldRetry = await authRetryOption.handler(fetchError, config);
								if (shouldRetry) {
									return request<T>({
										...config,
										_authRetryCount: authRetryCount + 1,
									});
								}
							}
						}
					}

					// ⚠️ 중요: HTTP 에러에 대한 일반 retry 로직을 에러 인터셉터 실행 전에 확인
					// 이렇게 해야 에러 인터셉터가 에러를 변경하기 전에 원본 에러로 retry 조건을 판단할 수 있음

					// Early return: 재시도 불가능한 경우 즉시 에러 인터셉터로 이동
					if (!canRetry(retryCount, maxRetries, isCanceled)) {
						return processErrorWithInterceptor<T, unknown>(fetchError, interceptors);
					}

					// HTTP 상태 코드 기반 재시도 여부 확인
					if (shouldRetryForHttpStatus(response.status, retryStatusCodes)) {
						retryCount++;
						// 새 AbortController 생성
						abortController = new AbortController();
						// 재시도 실행
						return executeRetry<T>(retryBackoff, retryCount, performRequest);
					}

					// 재시도 조건에 맞지 않는 경우 에러 인터셉터 실행
					return processErrorWithInterceptor<T, unknown>(fetchError, interceptors);
				}

				// NextTypeResponse 생성
				const NextTypeResponse: NextTypeResponse<T> = {
					data: responseData as T,
					status: response.status,
					statusText: response.statusText,
					headers: response.headers,
					config: requestConfig,
					request: requestInit as unknown as Request,
				};

				// 응답 인터셉터 실행
				const processedResponse = await interceptors.response.run(NextTypeResponse);

				// 스키마 검증 (스키마가 제공된 경우)
				if (schema) {
					try {
						const validatedData = schema.parse(processedResponse.data);

						// 검증된 데이터로 업데이트
						processedResponse.data = validatedData as T;

						return processedResponse;
					} catch (validationError) {
						// 스키마 검증 실패
						if (validationError instanceof z.ZodError) {
							const fetchError = new FetchError(
								"Validation failed",
								requestConfig,
								"ERR_VALIDATION",
								requestInit as unknown as Request,
								response,
								processedResponse.data,
							);

							fetchError.name = "ValidationError";
							fetchError.cause = validationError;

							// 에러 인터셉터 실행
							return processErrorWithInterceptor<T, T>(fetchError, interceptors);
						}

						// 알 수 없는 검증 오류
						const fetchError = new FetchError(
							"Unknown validation error",
							requestConfig,
							"ERR_VALIDATION_UNKNOWN",
							requestInit as unknown as Request,
							response,
							processedResponse.data,
						);

						// 에러 인터셉터 실행
						return processErrorWithInterceptor<T, T>(fetchError, interceptors);
					}
				}

				// 스키마 없이 응답 반환
				return processedResponse;
			} catch (error) {
				// FetchError는 에러 인터셉터가 이미 실행되었으므로 그대로 throw
				if (error instanceof FetchError) {
					throw error;
				}

				// 취소된 요청인 경우
				if (error instanceof Error && error.name === "AbortError") {
					const fetchError = new FetchError(
						isCanceled ? "Request was canceled" : "Request timed out",
						config,
						isCanceled ? "ERR_CANCELED" : "ERR_TIMEOUT",
					);

					// 에러 인터셉터 실행
					return processErrorWithInterceptor<T, unknown>(fetchError, interceptors);
				}

				// 재시도 로직 (네트워크 에러용)
				if (canRetry(retryCount, maxRetries, isCanceled) && isNetworkError(error)) {
					retryCount++;
					// 새 AbortController 생성
					abortController = new AbortController();
					// 재시도 실행
					return executeRetry(retryBackoff, retryCount, performRequest);
				}

				// 모든 재시도가 실패하거나 재시도가 없는 경우
				// 네트워크 에러 등을 FetchError로 변환
				const fetchError = new FetchError(
					error instanceof Error ? error.message : "Request failed",
					config,
					"ERR_NETWORK",
				);

				// 에러 인터셉터 실행
				return processErrorWithInterceptor<T>(fetchError, interceptors);
			}
		}

		// 요청 실행 프로미스 생성 및 activeRequests에 등록
		const requestPromise = performRequest().finally(() => {
			// 요청 완료 후 activeRequests에서 제거
			activeRequests.delete(requestKey);
		});

		// activeRequests에 추가
		activeRequests.set(requestKey, requestPromise);

		// 취소 가능한 프로미스 생성
		const cancelablePromise = Object.assign(requestPromise, {
			cancel,
			isCanceled: () => isCanceled,
		}) as CancelablePromise<NextTypeResponse<T>>;

		return cancelablePromise;
	}

	return request;
}
