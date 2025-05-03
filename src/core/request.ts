import { z } from "zod";
import type {
  CancelableRequest,
  FetchConfig,
  RequestConfig,
  ZodResponse,
} from "../types/index.js";
import { ContentType, HttpError, ResponseType } from "../types/index.js";
import {
  appendQueryParams,
  combineURLs,
  createTimeoutPromise,
  stringifyData,
} from "../utils/index.js";

interface InterceptorsType {
  request: {
    run: (config: RequestConfig) => Promise<RequestConfig>;
  };
  response: {
    run: (data: unknown) => Promise<unknown>;
    runError: (error: unknown) => Promise<unknown>;
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
        typeof data === "object" &&
        data !== null &&
        !(data instanceof URLSearchParams)
      ) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(
          data as Record<string, string>
        )) {
          if (value !== undefined && value !== null) {
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
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.XML },
      };

    // HTML 컨텐츠 타입
    case contentTypeStr === ContentType.HTML ||
      contentTypeStr.includes("text/html"):
      return {
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.HTML },
      };

    // 일반 텍스트
    case contentTypeStr === ContentType.TEXT ||
      contentTypeStr.includes("text/plain"):
      return {
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": ContentType.TEXT },
      };

    // 바이너리 데이터
    case contentTypeStr === ContentType.BLOB ||
      contentTypeStr.includes("application/octet-stream"): {
      const body =
        data instanceof Blob || data instanceof ArrayBuffer
          ? data
          : typeof data === "string"
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
        typeof data === "object" ? stringifyData(data) : String(data);

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

  switch (effectiveResponseType) {
    case ResponseType.JSON:
      try {
        return await response.json();
      } catch (e) {
        // JSON 파싱 실패 시 텍스트로 대체
        return await response.text();
      }

    case ResponseType.BLOB:
      return await response.blob();

    case ResponseType.ARRAY_BUFFER:
      return await response.arrayBuffer();

    case ResponseType.RAW:
      // Response 객체 자체를 반환
      return response;

    default:
      // 기본값은 텍스트
      return await response.text();
  }
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
  /**
   * 기본 요청 함수
   */
  function request<T>(config: RequestConfig): CancelableRequest<T> {
    // 취소 상태 관리
    let isCanceled = false;
    let abortController = new AbortController();

    // 취소 메서드
    const cancel = () => {
      isCanceled = true;
      abortController.abort();
    };

    // 최대 재시도 횟수
    const maxRetries = config.retry || 0;
    let retryCount = 0;

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
    async function performRequest(): Promise<ZodResponse<T>> {
      try {
        // 이미 취소된 경우 에러 반환
        if (isCanceled) {
          return {
            data: null,
            error: {
              message: "Request was canceled",
              raw: new Error("Request was canceled"),
            },
            status: 0,
            headers: new Headers(),
          };
        }

        // 스키마 추출 (요청 인터셉터 전에 제거)
        const { schema, throwOnHttpError = true, ...restConfig } = config;

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
            // 이미 취소된 경우 즉시 취소 응답 반환
            return {
              data: null,
              error: {
                message: "Request was canceled",
                raw: new Error("Request was canceled"),
              },
              status: 0,
              headers: new Headers(),
            };
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
        if (data !== undefined) {
          // Content-Type 결정 로직
          const effectiveContentType =
            contentType ||
            (headers as Record<string, string>)["Content-Type"] ||
            "";

          // 컨텐츠 타입이 제공되지 않았고 객체인 경우 기본값은 JSON
          if (
            effectiveContentType === "" &&
            typeof data === "object" &&
            data !== null &&
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
          return {
            data: null,
            error: {
              message: "Request was canceled",
              raw: new Error("Request was canceled"),
            },
            status: 0,
            headers: new Headers(),
          };
        }

        // 실제 fetch 요청 실행
        const fetchPromise = fetch(fullUrl, requestInit);

        // 타임아웃이 있으면 타임아웃 Promise와 함께 race
        const response = await (timeoutResult
          ? Promise.race([fetchPromise, timeoutResult.promise])
          : fetchPromise);

        // 응답 처리
        const contentTypeHeader = response.headers.get("content-type") || "";

        // HTTP 에러 검사
        if (!response.ok) {
          // 응답 데이터 처리
          const errorData = await processResponseByType(
            response,
            responseType as ResponseType,
            contentTypeHeader,
            requestConfig.parseJSON
          );

          // 에러 응답 객체 생성
          const errorResponse: ZodResponse<T> = {
            data: errorData as T,
            error: {
              message: response.statusText || `HTTP error ${response.status}`,
              status: response.status,
              raw: errorData,
            },
            status: response.status,
            headers: response.headers,
          };

          // throwOnHttpError 옵션이 true인 경우 예외 throw
          if (throwOnHttpError) {
            // HTTP 에러 생성
            const httpError = new HttpError(
              response.statusText || `HTTP error ${response.status}`,
              response.status,
              errorData,
              response.headers
            );

            throw httpError;
          }

          // throwOnHttpError가 false인 경우 구조화된 응답 반환
          return errorResponse;
        }

        // 응답 타입에 따라 응답 데이터 처리
        const responseData = await processResponseByType(
          response,
          responseType as ResponseType,
          contentTypeHeader,
          requestConfig.parseJSON
        );

        // 응답 인터셉터 실행
        const processedResponse = await interceptors.response.run(responseData);

        // 스키마 검증 (스키마가 제공된 경우)
        if (schema) {
          try {
            const validatedData = schema.parse(processedResponse) as T;

            return {
              data: validatedData,
              error: null,
              status: response.status,
              headers: response.headers,
            };
          } catch (validationError) {
            // 스키마 검증 실패
            if (validationError instanceof z.ZodError) {
              const validationErrorResponse: ZodResponse<T> = {
                data: processedResponse as T,
                error: {
                  message: "Validation failed",
                  status: response.status,
                  validation: validationError,
                  raw: processedResponse,
                },
                status: response.status,
                headers: response.headers,
              };

              // throwOnHttpError 옵션이 true인 경우 예외 throw
              if (throwOnHttpError) {
                // HTTP 에러 생성
                const httpError = new HttpError(
                  "Validation failed",
                  response.status,
                  processedResponse,
                  response.headers
                );
                httpError.name = "ValidationError";
                throw httpError;
              }

              return validationErrorResponse;
            }

            const unknownErrorResponse: ZodResponse<T> = {
              data: processedResponse as T,
              error: {
                message: "Unknown validation error",
                status: response.status,
                raw: processedResponse,
              },
              status: response.status,
              headers: response.headers,
            };

            // throwOnHttpError 옵션이 true인 경우 예외 throw
            if (throwOnHttpError) {
              // HTTP 에러 생성
              throw new HttpError(
                "Unknown validation error",
                response.status,
                processedResponse,
                response.headers
              );
            }

            return unknownErrorResponse;
          }
        }

        // 스키마 없이 응답 반환
        return {
          data: processedResponse as T,
          error: null,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        // HttpError는 그대로 throw
        if (error instanceof HttpError) {
          throw error;
        }

        // 취소된 요청인 경우 사용자 정의 에러 반환
        if (error instanceof Error && error.name === "AbortError") {
          return {
            data: null,
            error: {
              message: isCanceled
                ? "Request was canceled"
                : "Request timed out",
              raw: error,
            },
            status: 0,
            headers: new Headers(),
          };
        }

        // 재시도 로직
        if (retryCount < maxRetries && !isCanceled) {
          retryCount++;
          // 새 AbortController 생성 (이전 것은 abort되었을 수 있으므로)
          abortController = new AbortController();
          // 지수 백오프 - 재시도 간격을 점점 늘림 (1초, 2초, 4초...)
          const delay = Math.min(1000 * 2 ** (retryCount - 1), 10000); // 최대 10초까지 지연
          await new Promise((resolve) => setTimeout(resolve, delay));
          return performRequest();
        }

        // 모든 재시도가 실패하거나 재시도가 없는 경우
        // 에러 인터셉터 실행
        const processedError = await interceptors.response.runError(error);

        // 네트워크 에러 등은 그대로 구조화된 응답으로 반환
        return {
          data: null,
          error: {
            message:
              processedError instanceof Error
                ? processedError.message
                : "Request failed",
            raw: processedError,
          },
          status: 0, // 네트워크 오류의 경우 0으로 설정
          headers: new Headers(), // 빈 헤더 객체 제공
        };
      }
    }

    // 요청 실행 프로미스
    const requestPromise = performRequest();

    // 취소 가능한 프로미스 생성
    const cancelablePromise = Object.assign(requestPromise, {
      cancel,
      isCanceled: () => isCanceled,
    }) as CancelableRequest<T>;

    return cancelablePromise;
  }

  return request;
}
