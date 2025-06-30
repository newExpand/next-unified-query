import { z } from "zod/v4";
import type {
  NextTypeResponse,
  CancelablePromise,
  FetchConfig,
  RequestConfig,
  AuthRetryOption,
} from "../types";
import { ContentType, FetchError, ResponseType } from "../types";
import {
  appendQueryParams,
  combineURLs,
  createTimeoutPromise,
  stringifyData,
} from "../utils";
import { isFunction, isNumber, isObject, isString } from "es-toolkit/compat";
import { isNil } from "es-toolkit/predicate";

interface InterceptorsType {
  request: {
    run: (config: RequestConfig) => Promise<RequestConfig>;
  };
  response: {
    run: <T>(response: NextTypeResponse<T>) => Promise<NextTypeResponse<T>>;
  };
  error: {
    run: (error: FetchError) => Promise<NextTypeResponse<unknown> | FetchError>;
  };
}

/**
 * 특정 콘텐츠 타입에 맞게 요청 본문 데이터를 준비합니다.
 */
function prepareRequestBody(
  data: unknown,
  contentType: string,
  headers: Record<string, string>
): { body: BodyInit | null; headers: Record<string, string> } {
  const headersCopy = { ...headers };

  // FormData, URLSearchParams, Blob은 직접 전달
  if (
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    data instanceof Blob
  ) {
    // FormData의 경우 Content-Type 헤더를 설정하지 않도록 함
    if (
      data instanceof FormData &&
      (contentType === "" || contentType === ContentType.MULTIPART)
    ) {
      const { "Content-Type": _, ...remainingHeaders } = headersCopy;
      return { body: data, headers: remainingHeaders };
    }
    return { body: data, headers: headersCopy };
  }

  // 문자열로 변환된 컨텐츠 타입
  const contentTypeStr = String(contentType);

  // 컨텐츠 타입에 따른 처리
  switch (true) {
    // JSON 컨텐츠 타입
    case contentTypeStr === ContentType.JSON ||
      contentTypeStr.includes("application/json"):
      return {
        body: stringifyData(data),
        headers: { ...headersCopy, "Content-Type": ContentType.JSON },
      };

    // URL 인코딩된 폼 데이터
    case contentTypeStr === ContentType.FORM ||
      contentTypeStr.includes("application/x-www-form-urlencoded"): {
      let body: BodyInit;

      if (
        isObject(data) &&
        !(data instanceof URLSearchParams)
      ) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(
          data as Record<string, string>
        )) {
          if (!isNil(value)) {
            params.append(key, String(value));
          }
        }
        body = params;
      } else if (data instanceof URLSearchParams) {
        body = data;
      } else {
        // 문자열이나 null이면 그대로 사용
        body = String(data || "");
      }

      return {
        body,
        headers: { ...headersCopy, "Content-Type": ContentType.FORM },
      };
    }

    // XML 컨텐츠 타입
    case contentTypeStr === ContentType.XML ||
      contentTypeStr.includes("application/xml"):
      return {
        body: isString(data) ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.XML },
      };

    // HTML 컨텐츠 타입
    case contentTypeStr === ContentType.HTML ||
      contentTypeStr.includes("text/html"):
      return {
        body: isString(data) ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.HTML },
      };

    // 일반 텍스트
    case contentTypeStr === ContentType.TEXT ||
      contentTypeStr.includes("text/plain"):
      return {
        body: isString(data) ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.TEXT },
      };

    // 바이너리 데이터
    case contentTypeStr === ContentType.BLOB ||
      contentTypeStr.includes("application/octet-stream"): {
      const body =
        data instanceof Blob || data instanceof ArrayBuffer
          ? data
          : isString(data)
          ? data
          : String(data);

      return {
        body,
        headers: { ...headersCopy, "Content-Type": ContentType.BLOB },
      };
    }

    // 기타 컨텐츠 타입
    default: {
      const body =
        isObject(data) ? stringifyData(data) : String(data);

      return {
        body,
        headers: { ...headersCopy, "Content-Type": contentTypeStr },
      };
    }
  }
}

/**
 * 응답 타입에 따라 응답 데이터를 처리합니다.
 */
async function processResponseByType(
  response: Response,
  responseType: ResponseType,
  contentTypeHeader: string,
  parseJSON = true
): Promise<unknown> {
  // 응답 타입 결정
  const effectiveResponseType =
    responseType ||
    (contentTypeHeader.includes("application/json") && parseJSON !== false
      ? ResponseType.JSON
      : ResponseType.TEXT);

  // HEAD나 OPTIONS 요청과 같이 응답 본문이 없는 경우를 위한 안전 검사
  const isEmptyResponse =
    response.status === 204 || response.headers.get("content-length") === "0";

  // 응답 메서드 안전 검사 함수
  const safeCall = async <T>(
    method: "json" | "text" | "blob" | "arrayBuffer",
    fallback: T
  ): Promise<T> => {
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
 * 재시도 관련 도우미 함수들
 */

/**
 * 재시도 가능 여부를 확인합니다
 */
function canRetry(
  retryCount: number,
  maxRetries: number,
  isCanceled: boolean
): boolean {
  return retryCount < maxRetries && !isCanceled;
}

/**
 * HTTP 상태 코드가 재시도 대상인지 확인합니다
 */
function shouldRetryForHttpStatus(
  status: number,
  retryStatusCodes: number[]
): boolean {
  // retryStatusCodes가 빈 배열이면 모든 상태 코드에 대해 재시도
  return retryStatusCodes.length === 0 || retryStatusCodes.includes(status);
}

/**
 * 네트워크 에러인지 확인합니다 (HTTP 에러가 아닌 경우)
 */
function isNetworkError(error: unknown): boolean {
  return !(error instanceof FetchError);
}

/**
 * 재시도 실행 (공통 로직)
 */
async function executeRetry<T>(
  retryBackoff: (count: number) => number,
  retryCount: number,
  performRequest: () => Promise<NextTypeResponse<T>>
): Promise<NextTypeResponse<T>> {
  // 재시도 간격 계산 및 대기
  const delay = retryBackoff(retryCount);
  await new Promise((resolve) => setTimeout(resolve, delay));

  // 재시도 실행
  return performRequest();
}

/**
 * authRetry 관련 도우미 함수들
 */

/**
 * authRetry 설정이 유효한지 확인합니다
 */
function hasValidAuthRetry(authRetryOption: AuthRetryOption | undefined): authRetryOption is AuthRetryOption {
  return !isNil(authRetryOption) && isFunction(authRetryOption.handler);
}

/**
 * HTTP 상태 코드가 authRetry 대상인지 확인합니다
 */
function shouldAuthRetryForStatus(
  status: number,
  authRetryOption: AuthRetryOption
): boolean {
  const statusCodes = authRetryOption.statusCodes ?? [401];
  return statusCodes.includes(status);
}

/**
 * authRetry 조건을 만족하는지 확인합니다
 */
function shouldExecuteAuthRetry(
  fetchError: FetchError,
  config: RequestConfig,
  authRetryOption: AuthRetryOption
): boolean {
  return (
    !authRetryOption.shouldRetry ||
    authRetryOption.shouldRetry(fetchError, config)
  );
}

/**
 * authRetry 횟수 제한을 확인합니다
 */
function canAuthRetry(authRetryCount: number, authRetryOption: AuthRetryOption): boolean {
  return authRetryCount < (authRetryOption.limit ?? 1);
}

/**
 * 에러 인터셉터 처리 (공통 로직)
 */
async function processErrorWithInterceptor<T>(
  error: FetchError,
  interceptors: InterceptorsType
): Promise<NextTypeResponse<T> | never> {
  const processedError = await interceptors.error.run(error);

  // 만약 인터셉터가 NextTypeResponse를 반환하면 정상 응답으로 처리
  if ("data" in processedError && "status" in processedError) {
    return processedError as NextTypeResponse<T>;
  }

  throw processedError;
}

/**
 * 요청 함수 생성
 * @param defaultConfig 기본 설정
 * @param interceptors 인터셉터
 * @returns 요청 함수
 */
export function createRequestFunction(
  defaultConfig: FetchConfig,
  interceptors: InterceptorsType
) {
  // HTTP 레벨 중복 요청 방지를 위한 Map
  const activeRequests = new Map<string, Promise<NextTypeResponse<unknown>>>();
  /**
   * 기본 요청 함수
   */
  function request<T>(
    config: RequestConfig
  ): CancelablePromise<NextTypeResponse<T>> {
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
    let maxRetries = 0;
    let retryStatusCodes: number[] = [];
    let retryBackoff: (retryCount: number) => number = (count) =>
      Math.min(1000 * 2 ** (count - 1), 10000);

    if (isNumber(config.retry)) {
      maxRetries = config.retry;
    } else if (config.retry && isObject(config.retry)) {
      maxRetries = config.retry.limit;
      retryStatusCodes = config.retry.statusCodes || [];

      if (config.retry.backoff === "linear") {
        retryBackoff = (count) => 1000 * count;
      } else if (config.retry.backoff === "exponential") {
        retryBackoff = (count) => Math.min(1000 * 2 ** (count - 1), 10000);
      } else if (isFunction(config.retry.backoff)) {
        retryBackoff = config.retry.backoff;
      }
    }

    let retryCount = 0;
    let authRetryCount = config._authRetryCount || 0;
    const authRetryOption = config.authRetry || defaultConfig.authRetry;

    // 사용자 정의 AbortSignal이 있는 경우 즉시 확인
    if (config.signal) {
      if (config.signal.aborted) {
        // 이미 취소된 경우 즉시 취소 상태 설정
        isCanceled = true;
        abortController.abort();
      } else {
        // 이벤트 리스너 연결
        config.signal.addEventListener("abort", () => {
          isCanceled = true;
          abortController.abort();
        });
      }
    }

    // 재시도 함수
    async function performRequest(): Promise<NextTypeResponse<T>> {
      try {
        // 이미 취소된 경우 에러 반환
        if (isCanceled) {
          throw new FetchError("Request was canceled", config, "ERR_CANCELED");
        }

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

        // 사용자 정의 AbortSignal이 있으면 이벤트 리스너 연결
        if (requestConfig.signal && !isCanceled) {
          if (requestConfig.signal.aborted) {
            isCanceled = true;
            abortController.abort();
            // 이미 취소된 경우 즉시 취소 에러 던짐
            throw new FetchError(
              "Request was canceled",
              config,
              "ERR_CANCELED"
            );
          }
        }

        // 요청 옵션 구성 - fetch API 관련 속성만 추출
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
          signal, // 여기서는 사용하지 않음 (위에서 처리)
          contentType, // 새로 추가된 컨텐츠 타입 옵션
          responseType, // 새로 추가된 응답 타입 옵션
          data,
        } = requestConfig;

        // RequestInit 객체 생성 - fetch API 관련 속성만 포함
        const requestInit: RequestInit = {
          method,
          headers: headers as Record<string, string>,
          signal: abortController.signal, // 항상 내부 AbortController 사용
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
          // TypeScript 정의에는 next가 없으므로 타입 단언 사용
          // DOM 타입에는 next 속성이 없지만 Next.js는 이를 지원함
          (requestInit as RequestInit & { next?: typeof next }).next = next;
        }

        // data가 있으면 요청 본문에 추가
        if (!isNil(data)) {
          // Content-Type 결정 로직
          const effectiveContentType =
            contentType ||
            (headers as Record<string, string>)["Content-Type"] ||
            "";

          // 컨텐츠 타입이 제공되지 않았고 객체인 경우 기본값은 JSON
          if (
            effectiveContentType === "" &&
            isObject(data) &&
            !(data instanceof FormData) &&
            !(data instanceof URLSearchParams) &&
            !(data instanceof Blob)
          ) {
            // 기본적으로 JSON으로 처리
            requestInit.body = stringifyData(data);
            requestInit.headers = {
              ...(headers as Record<string, string>),
              "Content-Type": ContentType.JSON,
            };
          } else {
            // 컨텐츠 타입에 따라 요청 본문 데이터 처리
            const { body, headers: processedHeaders } = prepareRequestBody(
              data,
              effectiveContentType,
              headers as Record<string, string>
            );

            requestInit.body = body;
            requestInit.headers = processedHeaders;
          }
        }

        // 이미 취소된 경우 fetch를 호출하지 않음
        if (isCanceled) {
          throw new FetchError("Request was canceled", config, "ERR_CANCELED");
        }

        // 실제 fetch 요청 실행
        const fetchPromise = fetch(fullUrl, requestInit);

        // 타임아웃이 있으면 타임아웃 Promise와 함께 race
        const response = await (timeoutResult
          ? Promise.race([fetchPromise, timeoutResult.promise])
          : fetchPromise);

        // 응답 처리
        const contentTypeHeader = response.headers.get("content-type") || "";

        // 응답 타입에 따라 응답 데이터 처리
        const responseData = await processResponseByType(
          response,
          responseType as ResponseType,
          contentTypeHeader,
          requestConfig.parseJSON
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
            responseData
          );

          // ⚠️ 중요: authRetry 로직을 가장 먼저 확인 (401 전용)
          if (hasValidAuthRetry(authRetryOption)) {
            const statusMatch = shouldAuthRetryForStatus(response.status, authRetryOption);
            const shouldRetryResult = shouldExecuteAuthRetry(fetchError, config, authRetryOption);

            if (statusMatch && shouldRetryResult) {
              authRetryCount = config._authRetryCount || 0;
              if (canAuthRetry(authRetryCount, authRetryOption)) {
                const shouldRetry = await authRetryOption.handler(
                  fetchError,
                  config
                );
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
            return processErrorWithInterceptor<T>(fetchError, interceptors);
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
          return processErrorWithInterceptor<T>(fetchError, interceptors);
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
        const processedResponse = await interceptors.response.run(
          NextTypeResponse
        );

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
                processedResponse.data
              );

              fetchError.name = "ValidationError";

              // 에러 인터셉터 실행
              return processErrorWithInterceptor<T>(fetchError, interceptors);
            }

            // 알 수 없는 검증 오류
            const fetchError = new FetchError(
              "Unknown validation error",
              requestConfig,
              "ERR_VALIDATION_UNKNOWN",
              requestInit as unknown as Request,
              response,
              processedResponse.data
            );

            // 에러 인터셉터 실행
            return processErrorWithInterceptor<T>(fetchError, interceptors);
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
            isCanceled ? "ERR_CANCELED" : "ERR_TIMEOUT"
          );

          // 에러 인터셉터 실행
          return processErrorWithInterceptor<T>(fetchError, interceptors);
        }

        // 재시도 로직 (네트워크 에러용)
        if (
          canRetry(retryCount, maxRetries, isCanceled) &&
          isNetworkError(error)
        ) {
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
          "ERR_NETWORK"
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
