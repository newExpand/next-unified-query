import { z } from 'zod/v4';
import { isEmpty, isFunction as isFunction$1, isString as isString$1, isArray, forEach, isEqual, merge, isNil as isNil$1, pick, isPlainObject, keys } from 'es-toolkit/compat';
import { trim, pickBy, isNil, compact, isString, isFunction } from 'es-toolkit';
import QuickLRU from 'quick-lru';
import { isFunction as isFunction$2, isNotNil } from 'es-toolkit/predicate';

// src/types/index.ts
var ContentType = /* @__PURE__ */ ((ContentType2) => {
  ContentType2["JSON"] = "application/json";
  ContentType2["FORM"] = "application/x-www-form-urlencoded";
  ContentType2["TEXT"] = "text/plain";
  ContentType2["BLOB"] = "application/octet-stream";
  ContentType2["MULTIPART"] = "multipart/form-data";
  ContentType2["XML"] = "application/xml";
  ContentType2["HTML"] = "text/html";
  return ContentType2;
})(ContentType || {});
var ResponseType = /* @__PURE__ */ ((ResponseType2) => {
  ResponseType2["JSON"] = "json";
  ResponseType2["TEXT"] = "text";
  ResponseType2["BLOB"] = "blob";
  ResponseType2["ARRAY_BUFFER"] = "arraybuffer";
  ResponseType2["RAW"] = "raw";
  return ResponseType2;
})(ResponseType || {});
var FetchError = class extends Error {
  /**
   * FetchError 생성자
   * @param message 에러 메시지
   * @param config 요청 설정
   * @param code 에러 코드
   * @param request 요청 객체
   * @param response 응답 객체
   * @param responseData 응답 데이터
   */
  constructor(message, config, code, request2, response, responseData) {
    super(message);
    /**
     * 에러 이름
     */
    this.name = "FetchError";
    this.config = config;
    this.code = code;
    this.request = request2;
    if (response) {
      this.response = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    }
  }
};

// src/interceptors.ts
var interceptorTypeSymbols = {
  // 기본 인터셉터 유형
  default: Symbol("default-interceptor"),
  // 인증 관련 인터셉터 - 자동 교체 설정 가능
  auth: Symbol("auth-interceptor"),
  // 로깅 관련 인터셉터 - 자동 교체 설정 가능
  logging: Symbol("logging-interceptor"),
  // 에러 처리 인터셉터 - 자동 교체 설정 가능
  errorHandler: Symbol("error-handler-interceptor")
};
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
    this.idCounter = 0;
  }
  /**
   * 인터셉터 추가
   * @param handler 인터셉터 핸들러 함수
   * @param options 인터셉터 등록 옵션
   * @returns 제거 함수가 포함된 핸들 객체
   * @note 여러 번 use를 호출하면 등록한 모든 인터셉터가 순차적으로 실행됩니다. (Axios 등과 동일)
   */
  use(handler, options2) {
    const id = this.idCounter++;
    const type = options2?.type || interceptorTypeSymbols.default;
    const tag = options2?.tag || "unnamed-interceptor";
    this.handlers.push({
      id,
      handler,
      type,
      tag
    });
    return {
      remove: () => this.eject(id)
    };
  }
  /**
   * 인터셉터 제거
   * @param id 제거할 인터셉터 ID
   */
  eject(id) {
    const index = this.handlers.findIndex((h) => h !== null && h.id === id);
    if (index !== -1) {
      this.handlers[index] = null;
    }
  }
  /**
   * 특정 유형의 인터셉터 모두 제거
   * @param type 제거할 인터셉터 유형
   */
  ejectByType(type) {
    this.handlers.forEach((item, index) => {
      if (item !== null && item.type === type) {
        this.handlers[index] = null;
      }
    });
  }
  /**
   * 모든 인터셉터 제거
   */
  clear() {
    this.handlers = [];
  }
  /**
   * 모든 인터셉터 실행
   * @param value 인터셉터에 전달할 값
   * @returns 처리된 값
   */
  async forEach(value) {
    let result = value;
    for (const handler of this.handlers) {
      if (handler !== null) {
        result = await handler.handler(result);
      }
    }
    return result;
  }
  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.handlers.filter((h) => h !== null).map((h) => ({
      id: h?.id,
      tag: h?.tag || "(unnamed)",
      type: h?.type?.description || "default"
    }));
  }
};
var RequestInterceptorManager = class {
  constructor() {
    this.manager = new InterceptorManager();
  }
  /**
   * 요청 인터셉터 추가
   * @param interceptor 요청 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 auth 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(interceptor, type = interceptorTypeSymbols.auth) {
    return this.manager.use(interceptor, { type, tag: "request-interceptor" });
  }
  /**
   * 모든 요청 인터셉터 제거
   */
  clear() {
    this.manager.clear();
  }
  /**
   * 특정 유형의 인터셉터 모두 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type) {
    this.manager.ejectByType(type);
  }
  /**
   * 요청 인터셉터 실행
   */
  async run(config) {
    return this.manager.forEach(config);
  }
  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
};
var ResponseInterceptorManager = class {
  constructor() {
    this.manager = new InterceptorManager();
  }
  /**
   * 응답 인터셉터 추가
   * @param interceptor 응답 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 auth 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(interceptor, type = interceptorTypeSymbols.auth) {
    return this.manager.use(interceptor, { type, tag: "response-interceptor" });
  }
  /**
   * 모든 응답 인터셉터 제거
   */
  clear() {
    this.manager.clear();
  }
  /**
   * 특정 유형의 인터셉터 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type) {
    this.manager.ejectByType(type);
  }
  /**
   * 응답 인터셉터 실행 (내부용)
   */
  async run(response) {
    return this.manager.forEach(response);
  }
  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
};
var ErrorInterceptorManager = class {
  constructor() {
    this.manager = new InterceptorManager();
  }
  /**
   * 에러 인터셉터 추가
   * @param interceptor 에러 인터셉터 함수
   * @param type 인터셉터 유형 - 기본값은 errorHandler 타입 (자동 교체됨)
   * @returns 제거 함수가 포함된 핸들 객체
   */
  use(interceptor, type = interceptorTypeSymbols.errorHandler) {
    return this.manager.use(interceptor, { type, tag: "error-interceptor" });
  }
  /**
   * 모든 에러 인터셉터 제거
   */
  clear() {
    this.manager.clear();
  }
  /**
   * 특정 유형의 인터셉터 제거
   * @param type 제거할 인터셉터 유형
   */
  clearByType(type) {
    this.manager.ejectByType(type);
  }
  /**
   * 에러 인터셉터 실행 (내부용)
   */
  async run(error) {
    return this.manager.forEach(error);
  }
  /**
   * 디버깅 용도로 현재 등록된 인터셉터 정보 반환
   */
  getRegisteredInterceptors() {
    return this.manager.getRegisteredInterceptors();
  }
};
function createInterceptors() {
  const requestInterceptors = new RequestInterceptorManager();
  const responseInterceptors = new ResponseInterceptorManager();
  const errorInterceptors = new ErrorInterceptorManager();
  return {
    request: {
      /**
       * 요청 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param interceptor 요청 처리 함수
       * @returns 제거 함수가 포함된 핸들
       * @example
       * ```typescript
       * // 인터셉터 추가 (auth 유형 기본값)
       * const authInterceptor = api.interceptors.request.use(config => {
       *   config.headers = config.headers || {};
       *   config.headers['Authorization'] = `Bearer ${getToken()}`;
       *   return config;
       * });
       *
       * // 다른 인터셉터 추가 시 이전 auth 유형 인터셉터는 자동 제거됨
       * api.interceptors.request.use(config => {
       *   config.headers = config.headers || {};
       *   config.headers['Authorization'] = `Bearer ${getNewToken()}`;
       *   return config;
       * });
       * ```
       */
      use: (interceptor) => requestInterceptors.use(interceptor),
      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id) => {
        console.warn(
          "eject() \uBA54\uC11C\uB4DC\uB294 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. use()\uAC00 \uBC18\uD658\uD558\uB294 InterceptorHandle.remove()\uB97C \uC0AC\uC6A9\uD558\uC138\uC694."
        );
      },
      /**
       * 모든 요청 인터셉터 제거
       * @example
       * ```typescript
       * // 모든 요청 인터셉터 제거
       * api.interceptors.request.clear();
       * ```
       */
      clear: () => requestInterceptors.clear(),
      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       * @example
       * ```typescript
       * // 인증 관련 인터셉터만 제거
       * api.interceptors.request.clearByType(interceptorTypes.auth);
       * ```
       */
      clearByType: (type) => requestInterceptors.clearByType(type),
      /**
       * 요청 인터셉터 실행 (내부용)
       */
      run: requestInterceptors.run.bind(requestInterceptors),
      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => requestInterceptors.getRegisteredInterceptors()
    },
    response: {
      /**
       * 응답 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param onFulfilled 성공 응답 처리 함수
       * @returns 제거 함수가 포함된 핸들
       */
      use: (onFulfilled) => responseInterceptors.use(onFulfilled),
      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id) => {
        console.warn(
          "eject() \uBA54\uC11C\uB4DC\uB294 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. use()\uAC00 \uBC18\uD658\uD558\uB294 InterceptorHandle.remove()\uB97C \uC0AC\uC6A9\uD558\uC138\uC694."
        );
      },
      /**
       * 모든 응답 인터셉터 제거
       */
      clear: () => responseInterceptors.clear(),
      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       */
      clearByType: (type) => responseInterceptors.clearByType(type),
      /**
       * 응답 인터셉터 실행 (내부용)
       */
      run: responseInterceptors.run.bind(responseInterceptors),
      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => responseInterceptors.getRegisteredInterceptors()
    },
    error: {
      /**
       * 에러 인터셉터 추가 - 자동으로 같은 유형의 이전 인터셉터 교체
       * @param onRejected 에러 처리 함수
       * @returns 제거 함수가 포함된 핸들
       */
      use: (onRejected) => errorInterceptors.use(onRejected),
      /**
       * 인터셉터 제거 (하위 호환성)
       * @deprecated InterceptorHandle.remove() 사용 권장
       */
      eject: (id) => {
        console.warn(
          "eject() \uBA54\uC11C\uB4DC\uB294 \uC0AC\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. use()\uAC00 \uBC18\uD658\uD558\uB294 InterceptorHandle.remove()\uB97C \uC0AC\uC6A9\uD558\uC138\uC694."
        );
      },
      /**
       * 모든 에러 인터셉터 제거
       */
      clear: () => errorInterceptors.clear(),
      /**
       * 특정 유형의 인터셉터 제거
       * @param type 제거할 인터셉터 유형
       */
      clearByType: (type) => errorInterceptors.clearByType(type),
      /**
       * 에러 인터셉터 실행 (내부용)
       */
      run: errorInterceptors.run.bind(errorInterceptors),
      /**
       * 디버깅 용도로 현재 등록된 인터셉터 정보 조회
       */
      getRegistered: () => errorInterceptors.getRegisteredInterceptors()
    }
  };
}
var interceptorTypes = interceptorTypeSymbols;
function appendQueryParams(url, params) {
  const cleanUrl = trim(url);
  if (!params || isEmpty(params)) return cleanUrl;
  const validParams = pickBy(params, (value) => !isNil(value));
  if (isEmpty(validParams)) return cleanUrl;
  const [baseUrl, fragment] = cleanUrl.split("#");
  const [path, existingQuery] = baseUrl.split("?");
  const existingParams = new URLSearchParams(existingQuery || "");
  Object.entries(validParams).forEach(([key, value]) => {
    existingParams.set(key, String(value));
  });
  const queryString = existingParams.toString();
  const urlParts = compact([
    path,
    queryString ? `?${queryString}` : null,
    fragment ? `#${fragment}` : null
  ]);
  return urlParts.join("");
}
function combineURLs(baseURL, url) {
  const cleanBaseURL = baseURL ? trim(baseURL) : "";
  const cleanUrl = url ? trim(url) : "";
  if (!cleanBaseURL) return cleanUrl;
  if (!cleanUrl) return cleanBaseURL;
  const baseEndsWithSlash = cleanBaseURL.endsWith("/");
  const urlStartsWithSlash = cleanUrl.startsWith("/");
  if (baseEndsWithSlash && urlStartsWithSlash) {
    return cleanBaseURL + cleanUrl.substring(1);
  }
  if (!baseEndsWithSlash && !urlStartsWithSlash) {
    return `${cleanBaseURL}/${cleanUrl}`;
  }
  return cleanBaseURL + cleanUrl;
}

// src/utils/config.ts
function mergeConfigs(defaultConfig = {}, requestConfig = {}) {
  const mergedConfig = {
    ...defaultConfig,
    ...requestConfig
  };
  mergedConfig.headers = {
    ...defaultConfig.headers,
    ...requestConfig.headers
  };
  mergedConfig.params = {
    ...defaultConfig.params,
    ...requestConfig.params
  };
  if (defaultConfig.next || requestConfig.next) {
    mergedConfig.next = {
      ...defaultConfig.next,
      ...requestConfig.next
    };
  }
  return mergedConfig;
}
function stringifyData(data) {
  if (isNil(data)) return null;
  if (isString(data)) return data;
  try {
    return JSON.stringify(data);
  } catch (e) {
    console.error("Failed to stringify data:", e);
    return null;
  }
}

// src/utils/timeout.ts
function createTimeoutPromise(ms) {
  if (!ms || ms <= 0) return null;
  const controller = new AbortController();
  const promise = new Promise((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout of ${ms}ms exceeded`));
    }, ms);
  });
  return { promise, controller };
}

// src/utils/response.ts
function unwrap(response) {
  return response.data;
}
function getStatus(response) {
  return response.status;
}
function getHeaders(response) {
  return response.headers;
}
function hasStatus(response, code) {
  return response.status === code;
}
function createError(message, config, code = "ERR_UNKNOWN", response, data) {
  return new FetchError(message, config, code, void 0, response, data);
}
function isFetchError(error) {
  return error instanceof FetchError;
}
function hasErrorCode(error, code) {
  return isFetchError(error) && error.code === code;
}
var ErrorCode = {
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
  UNKNOWN: "ERR_UNKNOWN"
};
function handleFetchError(error, handlers) {
  if (isFetchError(error) && error.code) {
    const errorCode = error.code;
    const handler = handlers[errorCode];
    if (handler) {
      return handler(error);
    }
  }
  if (handlers.default) {
    return handlers.default(error);
  }
  throw error;
}
function handleHttpError(error, handlers) {
  if (isFetchError(error) && error.response && isFunction(handlers[error.response.status])) {
    return handlers[error.response.status](error);
  }
  if (handlers.default) {
    return handlers.default(error);
  }
  throw error;
}
function errorToResponse(error, data) {
  return {
    data,
    status: error.response?.status || 500,
    statusText: error.response?.statusText || error.message,
    headers: error.response?.headers || new Headers(),
    config: error.config,
    request: error.request
  };
}

// src/core/request.ts
function prepareRequestBody(data, contentType, headers) {
  const headersCopy = { ...headers };
  if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob) {
    if (data instanceof FormData && (contentType === "" || contentType === "multipart/form-data" /* MULTIPART */)) {
      const { "Content-Type": _, ...remainingHeaders } = headersCopy;
      return { body: data, headers: remainingHeaders };
    }
    return { body: data, headers: headersCopy };
  }
  const contentTypeStr = String(contentType);
  switch (true) {
    // JSON 컨텐츠 타입
    case (contentTypeStr === "application/json" /* JSON */ || contentTypeStr.includes("application/json")):
      return {
        body: stringifyData(data),
        headers: { ...headersCopy, "Content-Type": "application/json" /* JSON */ }
      };
    // URL 인코딩된 폼 데이터
    case (contentTypeStr === "application/x-www-form-urlencoded" /* FORM */ || contentTypeStr.includes("application/x-www-form-urlencoded")): {
      let body;
      if (typeof data === "object" && data !== null && !(data instanceof URLSearchParams)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(
          data
        )) {
          if (value !== void 0 && value !== null) {
            params.append(key, String(value));
          }
        }
        body = params;
      } else if (data instanceof URLSearchParams) {
        body = data;
      } else {
        body = String(data || "");
      }
      return {
        body,
        headers: { ...headersCopy, "Content-Type": "application/x-www-form-urlencoded" /* FORM */ }
      };
    }
    // XML 컨텐츠 타입
    case (contentTypeStr === "application/xml" /* XML */ || contentTypeStr.includes("application/xml")):
      return {
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": "application/xml" /* XML */ }
      };
    // HTML 컨텐츠 타입
    case (contentTypeStr === "text/html" /* HTML */ || contentTypeStr.includes("text/html")):
      return {
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": "text/html" /* HTML */ }
      };
    // 일반 텍스트
    case (contentTypeStr === "text/plain" /* TEXT */ || contentTypeStr.includes("text/plain")):
      return {
        body: typeof data === "string" ? data : String(data),
        headers: { ...headersCopy, "Content-Type": "text/plain" /* TEXT */ }
      };
    // 바이너리 데이터
    case (contentTypeStr === "application/octet-stream" /* BLOB */ || contentTypeStr.includes("application/octet-stream")): {
      const body = data instanceof Blob || data instanceof ArrayBuffer ? data : typeof data === "string" ? data : String(data);
      return {
        body,
        headers: { ...headersCopy, "Content-Type": "application/octet-stream" /* BLOB */ }
      };
    }
    // 기타 컨텐츠 타입
    default: {
      const body = typeof data === "object" ? stringifyData(data) : String(data);
      return {
        body,
        headers: { ...headersCopy, "Content-Type": contentTypeStr }
      };
    }
  }
}
async function processResponseByType(response, responseType, contentTypeHeader, parseJSON = true) {
  const effectiveResponseType = responseType || (contentTypeHeader.includes("application/json") && parseJSON !== false ? "json" /* JSON */ : "text" /* TEXT */);
  const isEmptyResponse = response.status === 204 || response.headers.get("content-length") === "0";
  const safeCall = async (method, fallback) => {
    if (!response[method] || typeof response[method] !== "function") {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        try {
          if (response[method] && typeof response[method] === "function") {
            return await response[method]();
          }
        } catch (e) {
        }
      }
      return fallback;
    }
    try {
      return await response[method]();
    } catch (e) {
      console.warn(`Failed to process response with ${method}:`, e);
      return fallback;
    }
  };
  switch (effectiveResponseType) {
    case "json" /* JSON */:
      if (isEmptyResponse) {
        return {};
      }
      try {
        return await response.json();
      } catch (e) {
        return await safeCall("text", "");
      }
    case "blob" /* BLOB */:
      if (isEmptyResponse) {
        return new Blob();
      }
      return await safeCall("blob", new Blob());
    case "arraybuffer" /* ARRAY_BUFFER */:
      if (isEmptyResponse) {
        return new ArrayBuffer(0);
      }
      return await safeCall("arrayBuffer", new ArrayBuffer(0));
    case "raw" /* RAW */:
      return response;
    default:
      if (isEmptyResponse) {
        return "";
      }
      return await safeCall("text", "");
  }
}
function createRequestFunction(defaultConfig, interceptors2) {
  function request2(config) {
    let isCanceled = false;
    let abortController = new AbortController();
    const cancel = () => {
      isCanceled = true;
      abortController.abort();
    };
    let maxRetries = 0;
    let retryStatusCodes = [];
    let retryBackoff = (count) => Math.min(1e3 * 2 ** (count - 1), 1e4);
    if (typeof config.retry === "number") {
      maxRetries = config.retry;
    } else if (config.retry && typeof config.retry === "object") {
      maxRetries = config.retry.limit;
      retryStatusCodes = config.retry.statusCodes || [];
      if (config.retry.backoff === "linear") {
        retryBackoff = (count) => 1e3 * count;
      } else if (config.retry.backoff === "exponential") {
        retryBackoff = (count) => Math.min(1e3 * 2 ** (count - 1), 1e4);
      } else if (typeof config.retry.backoff === "function") {
        retryBackoff = config.retry.backoff;
      }
    }
    let retryCount = 0;
    let authRetryCount = config._authRetryCount || 0;
    const authRetryOption = config.authRetry || defaultConfig.authRetry;
    if (config.signal) {
      if (config.signal.aborted) {
        isCanceled = true;
        abortController.abort();
      } else {
        config.signal.addEventListener("abort", () => {
          isCanceled = true;
          abortController.abort();
        });
      }
    }
    async function performRequest() {
      try {
        if (isCanceled) {
          throw new FetchError("Request was canceled", config, "ERR_CANCELED");
        }
        const { schema, ...restConfig } = config;
        const requestConfig = await interceptors2.request.run(restConfig);
        const url = combineURLs(requestConfig.baseURL, requestConfig.url);
        const fullUrl = appendQueryParams(url, requestConfig.params);
        const timeoutResult = createTimeoutPromise(requestConfig.timeout);
        if (requestConfig.signal && !isCanceled) {
          if (requestConfig.signal.aborted) {
            isCanceled = true;
            abortController.abort();
            throw new FetchError(
              "Request was canceled",
              config,
              "ERR_CANCELED"
            );
          }
        }
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
          signal,
          // 여기서는 사용하지 않음 (위에서 처리)
          contentType,
          // 새로 추가된 컨텐츠 타입 옵션
          responseType,
          // 새로 추가된 응답 타입 옵션
          data
        } = requestConfig;
        const requestInit = {
          method,
          headers,
          signal: abortController.signal,
          // 항상 내부 AbortController 사용
          cache,
          credentials,
          integrity,
          keepalive,
          mode,
          redirect,
          referrer,
          referrerPolicy
        };
        if (next) {
          requestInit.next = next;
        }
        if (data !== void 0) {
          const effectiveContentType = contentType || headers["Content-Type"] || "";
          if (effectiveContentType === "" && typeof data === "object" && data !== null && !(data instanceof FormData) && !(data instanceof URLSearchParams) && !(data instanceof Blob)) {
            requestInit.body = stringifyData(data);
            requestInit.headers = {
              ...headers,
              "Content-Type": "application/json" /* JSON */
            };
          } else {
            const { body, headers: processedHeaders } = prepareRequestBody(
              data,
              effectiveContentType,
              headers
            );
            requestInit.body = body;
            requestInit.headers = processedHeaders;
          }
        }
        if (isCanceled) {
          throw new FetchError("Request was canceled", config, "ERR_CANCELED");
        }
        const fetchPromise = fetch(fullUrl, requestInit);
        const response = await (timeoutResult ? Promise.race([fetchPromise, timeoutResult.promise]) : fetchPromise);
        const contentTypeHeader = response.headers.get("content-type") || "";
        const responseData = await processResponseByType(
          response,
          responseType,
          contentTypeHeader,
          requestConfig.parseJSON
        );
        if (!response.ok) {
          const fetchError = new FetchError(
            response.statusText || `HTTP error ${response.status}`,
            requestConfig,
            "ERR_BAD_RESPONSE",
            requestInit,
            response,
            responseData
          );
          const processedError = await interceptors2.error.run(fetchError);
          if ("data" in processedError && "status" in processedError) {
            return processedError;
          }
          throw processedError;
        }
        const NextTypeResponse = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: requestConfig,
          request: requestInit
        };
        const processedResponse = await interceptors2.response.run(
          NextTypeResponse
        );
        if (schema) {
          try {
            const validatedData = schema.parse(processedResponse.data);
            processedResponse.data = validatedData;
            return processedResponse;
          } catch (validationError) {
            if (validationError instanceof z.ZodError) {
              const fetchError2 = new FetchError(
                "Validation failed",
                requestConfig,
                "ERR_VALIDATION",
                requestInit,
                response,
                processedResponse.data
              );
              fetchError2.name = "ValidationError";
              const processedError2 = await interceptors2.error.run(fetchError2);
              if ("data" in processedError2 && "status" in processedError2) {
                return processedError2;
              }
              throw processedError2;
            }
            const fetchError = new FetchError(
              "Unknown validation error",
              requestConfig,
              "ERR_VALIDATION_UNKNOWN",
              requestInit,
              response,
              processedResponse.data
            );
            const processedError = await interceptors2.error.run(fetchError);
            if ("data" in processedError && "status" in processedError) {
              return processedError;
            }
            throw processedError;
          }
        }
        return processedResponse;
      } catch (error) {
        if (error instanceof FetchError && authRetryOption && typeof authRetryOption.handler === "function") {
          const statusCodes = authRetryOption.statusCodes ?? [401];
          const statusMatch = error.response && statusCodes.includes(error.response.status);
          const shouldRetryResult = !authRetryOption.shouldRetry || authRetryOption.shouldRetry(error, config);
          if (statusMatch && shouldRetryResult) {
            authRetryCount = config._authRetryCount || 0;
            if (authRetryCount < (authRetryOption.limit ?? 1)) {
              const shouldRetry = await authRetryOption.handler(error, config);
              if (shouldRetry) {
                return request2({
                  ...config,
                  _authRetryCount: authRetryCount + 1
                });
              }
            }
          }
        }
        if (error instanceof FetchError) {
          throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
          const fetchError2 = new FetchError(
            isCanceled ? "Request was canceled" : "Request timed out",
            config,
            isCanceled ? "ERR_CANCELED" : "ERR_TIMEOUT"
          );
          const processedError2 = await interceptors2.error.run(fetchError2);
          if ("data" in processedError2 && "status" in processedError2) {
            return processedError2;
          }
          throw processedError2;
        }
        if (retryCount < maxRetries && !isCanceled) {
          if (error instanceof FetchError && error.response && (retryStatusCodes.length === 0 || retryStatusCodes.includes(error.response.status))) {
            retryCount++;
            abortController = new AbortController();
            const delay = retryBackoff(retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return performRequest();
          }
          if (!(error instanceof FetchError)) {
            retryCount++;
            abortController = new AbortController();
            const delay = retryBackoff(retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return performRequest();
          }
        }
        const fetchError = new FetchError(
          error instanceof Error ? error.message : "Request failed",
          config,
          "ERR_NETWORK"
        );
        const processedError = await interceptors2.error.run(fetchError);
        if ("data" in processedError && "status" in processedError) {
          return processedError;
        }
        throw processedError;
      }
    }
    const requestPromise = performRequest();
    const cancelablePromise = Object.assign(requestPromise, {
      cancel,
      isCanceled: () => isCanceled
    });
    return cancelablePromise;
  }
  return request2;
}

// src/methods/index.ts
function createHttpMethods(request2, defaultConfig) {
  return {
    get(url, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "GET"
        })
      );
    },
    post(url, data, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "POST",
          data
        })
      );
    },
    put(url, data, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "PUT",
          data
        })
      );
    },
    delete(url, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "DELETE"
        })
      );
    },
    patch(url, data, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "PATCH",
          data
        })
      );
    },
    head(url, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "HEAD"
        })
      );
    },
    options(url, config = {}) {
      return request2(
        mergeConfigs(defaultConfig, {
          ...config,
          url,
          method: "OPTIONS"
        })
      );
    }
  };
}

// src/core/client.ts
function createFetch(defaultConfig = {}) {
  const mergedConfig = {
    ...defaultConfig
  };
  const interceptors2 = createInterceptors();
  const request2 = createRequestFunction(mergedConfig, interceptors2);
  const methods = createHttpMethods(request2, mergedConfig);
  const instance = {
    defaults: mergedConfig,
    interceptors: interceptors2,
    request: request2,
    ...methods
  };
  return instance;
}

// src/fetch.ts
var defaultInstance = createFetch();
var request = defaultInstance.request;
var get = defaultInstance.get;
var post = defaultInstance.post;
var put = defaultInstance.put;
var del = defaultInstance.delete;
var patch = defaultInstance.patch;
var head = defaultInstance.head;
var options = defaultInstance.options;
var ntFetch = defaultInstance.defaults;
var interceptors = defaultInstance.interceptors;
var fetch_default = defaultInstance;
var ERROR_MESSAGES = {
  BOTH_APPROACHES: "QueryConfig cannot have both 'queryFn' and 'url' at the same time. Choose either custom function approach (queryFn) or URL-based approach (url).",
  MISSING_APPROACHES: "QueryConfig must have either 'queryFn' or 'url'. Provide either a custom function or URL-based configuration."
};
function validateQueryConfig(config) {
  const hasQueryFn = isFunction$1(config.queryFn);
  const hasUrl = isFunction$1(config.url) || isString$1(config.url);
  if (hasQueryFn && hasUrl) {
    throw new Error(ERROR_MESSAGES.BOTH_APPROACHES);
  }
  if (!hasQueryFn && !hasUrl) {
    throw new Error(ERROR_MESSAGES.MISSING_APPROACHES);
  }
}
function createQueryFactory(defs) {
  Object.entries(defs).forEach(([key, config]) => {
    try {
      validateQueryConfig(config);
    } catch (error) {
      throw new Error(
        `Invalid QueryConfig for '${key}': ${error.message}`
      );
    }
  });
  return defs;
}
var ERROR_MESSAGES2 = {
  BOTH_APPROACHES: "MutationConfig cannot have both 'mutationFn' and 'url'+'method' at the same time. Choose either custom function approach (mutationFn) or URL-based approach (url + method).",
  MISSING_APPROACHES: "MutationConfig must have either 'mutationFn' or both 'url' and 'method'. Provide either a custom function or URL-based configuration."
};
function validateMutationConfig(config) {
  const hasMutationFn = isFunction$1(config.mutationFn);
  const hasUrlMethod = config.url && config.method;
  if (hasMutationFn && hasUrlMethod) {
    throw new Error(ERROR_MESSAGES2.BOTH_APPROACHES);
  }
  if (!hasMutationFn && !hasUrlMethod) {
    throw new Error(ERROR_MESSAGES2.MISSING_APPROACHES);
  }
}
function createMutationFactory(defs) {
  Object.entries(defs).forEach(([key, config]) => {
    try {
      validateMutationConfig(config);
    } catch (error) {
      throw new Error(
        `Invalid MutationConfig for '${key}': ${error.message}`
      );
    }
  });
  return defs;
}
function serializeQueryKey(key) {
  return isArray(key) ? JSON.stringify(key) : isString$1(key) ? key : String(key);
}
var QueryCache = class {
  constructor(options2 = {}) {
    this.subscribers = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
    this.gcTimers = /* @__PURE__ */ new Map();
    const { maxQueries = 1e3 } = options2;
    this.cache = new QuickLRU({
      maxSize: maxQueries,
      onEviction: (key, value) => {
        this.cleanupMetadata(key);
      }
    });
  }
  /**
   * 특정 키의 메타데이터를 정리합니다.
   */
  cleanupMetadata(sKey) {
    this.subscribers.delete(sKey);
    this.listeners.delete(sKey);
    const timer = this.gcTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.gcTimers.delete(sKey);
    }
  }
  set(key, state) {
    const sKey = serializeQueryKey(key);
    this.cache.set(sKey, state);
    this.notifyListeners(sKey);
  }
  get(key) {
    const result = this.cache.get(serializeQueryKey(key));
    return result;
  }
  has(key) {
    const result = this.cache.has(serializeQueryKey(key));
    return result;
  }
  delete(key) {
    const sKey = serializeQueryKey(key);
    this.cache.delete(sKey);
    this.cleanupMetadata(sKey);
  }
  clear() {
    this.cache.clear();
    this.subscribers.clear();
    this.listeners.clear();
    this.gcTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.gcTimers.clear();
  }
  getAll() {
    const result = {};
    for (const [key, value] of this.cache.entries()) {
      result[key] = value;
    }
    return result;
  }
  /**
   * 컴포넌트가 쿼리를 구독하여 refetch 콜백을 등록합니다.
   * @returns unsubscribe 함수
   */
  subscribeListener(key, listener) {
    const sKey = serializeQueryKey(key);
    if (!this.listeners.has(sKey)) {
      this.listeners.set(sKey, /* @__PURE__ */ new Set());
    }
    this.listeners.get(sKey).add(listener);
    return () => {
      const listenerSet = this.listeners.get(sKey);
      if (listenerSet) {
        listenerSet.delete(listener);
        if (listenerSet.size === 0) {
          this.listeners.delete(sKey);
        }
      }
    };
  }
  /**
   * 특정 쿼리 키의 모든 리스너에게 알림을 보냅니다.
   */
  notifyListeners(key) {
    const sKey = serializeQueryKey(key);
    Promise.resolve().then(() => {
      this.listeners.get(sKey)?.forEach((l) => l());
    });
  }
  /**
   * 구독자 수 증가 및 gcTime 타이머 해제 (생명주기 관리)
   */
  subscribe(key) {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    this.subscribers.set(sKey, prev + 1);
    const timer = this.gcTimers.get(sKey);
    if (timer) {
      clearTimeout(timer);
      this.gcTimers.delete(sKey);
    }
  }
  /**
   * 구독자 수 감소 및 0이 되면 gcTime 타이머 시작 (생명주기 관리)
   */
  unsubscribe(key, gcTime) {
    const sKey = serializeQueryKey(key);
    const prev = this.subscribers.get(sKey) ?? 0;
    if (prev <= 1) {
      this.subscribers.set(sKey, 0);
      const timer = setTimeout(() => {
        this.delete(key);
      }, gcTime);
      this.gcTimers.set(sKey, timer);
    } else {
      this.subscribers.set(sKey, prev - 1);
    }
  }
  serialize() {
    return this.getAll();
  }
  deserialize(cache) {
    Object.entries(cache).forEach(([key, state]) => {
      this.cache.set(key, state);
    });
  }
  /**
   * 현재 캐시 크기를 반환합니다.
   */
  get size() {
    return this.cache.size;
  }
  /**
   * 캐시의 최대 크기를 반환합니다.
   */
  get maxSize() {
    return this.cache.maxSize;
  }
  /**
   * 캐시 통계를 반환합니다.
   *
   * @description 디버깅 및 모니터링 목적으로 사용됩니다.
   * 성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
   *
   * @example
   * ```typescript
   * const queryClient = useQueryClient();
   * const stats = queryClient.getQueryCache().getStats();
   * console.log('Current cache size:', stats.cacheSize);
   * console.log('Active GC timers:', stats.activeGcTimersCount);
   * ```
   */
  getStats() {
    return {
      /** 현재 캐시된 쿼리 수 */
      cacheSize: this.cache.size,
      /** 최대 쿼리 수 (메모리 보호 한계) */
      maxSize: this.cache.maxSize,
      /** 활성 구독자 수 */
      subscribersCount: this.subscribers.size,
      /** 등록된 리스너 수 */
      listenersCount: this.listeners.size,
      /** 활성 GC 타이머 수 (생명주기 관리 중인 쿼리) */
      activeGcTimersCount: this.gcTimers.size
    };
  }
};
var QueryClient = class {
  constructor(options2) {
    this.cache = new QueryCache(options2?.queryCache);
    this.fetcher = options2?.fetcher || createFetch(options2);
  }
  has(key) {
    return this.cache.has(key);
  }
  getFetcher() {
    return this.fetcher;
  }
  /**
   * 쿼리 상태 조회
   */
  get(key) {
    return this.cache.get(key);
  }
  /**
   * 쿼리 상태 저장
   */
  set(key, state) {
    this.cache.set(key, state);
  }
  /**
   * 쿼리 데이터만 업데이트 (optimistic update에 최적화)
   * 기존 상태(isLoading, isFetching, error)를 유지하면서 data와 updatedAt만 업데이트
   */
  setQueryData(key, updater) {
    const existing = this.get(key);
    const newData = typeof updater === "function" ? updater(existing?.data) : updater;
    const newState = {
      data: newData,
      error: existing?.error,
      isLoading: existing?.isLoading ?? false,
      isFetching: existing?.isFetching ?? false,
      updatedAt: Date.now()
    };
    this.set(key, newState);
  }
  /**
   * 쿼리 상태 삭제
   */
  delete(key) {
    this.cache.delete(key);
  }
  /**
   * 모든 쿼리 상태 반환
   */
  getAll() {
    return this.cache.getAll();
  }
  /**
   * 모든 쿼리 상태 초기화
   */
  clear() {
    this.cache.clear();
  }
  /**
   * 특정 쿼리키(혹은 prefix)로 시작하는 모든 쿼리 캐시를 무효화(삭제)
   * 예: invalidateQueries(['user']) → ['user', ...]로 시작하는 모든 캐시 삭제
   */
  invalidateQueries(prefix) {
    const all = this.getAll();
    if (isArray(prefix)) {
      const prefixArr = Array.from(prefix);
      forEach(Object.keys(all), (key) => {
        try {
          const keyArr = JSON.parse(key);
          if (Array.isArray(keyArr) && isEqual(keyArr.slice(0, prefixArr.length), prefixArr)) {
            const currentState = this.cache.get(keyArr);
            if (currentState) {
              this.cache.set(keyArr, { ...currentState, updatedAt: 0 });
            }
          }
        } catch {
        }
      });
    } else {
      const prefixStr = isString$1(prefix) ? prefix : String(prefix);
      forEach(Object.keys(all), (key) => {
        if (key.startsWith(prefixStr)) {
          const currentState = this.cache.get(key);
          if (currentState) {
            this.cache.set(key, { ...currentState, updatedAt: 0 });
          }
        }
      });
    }
  }
  /**
   * 구독자 관리 (public)
   */
  subscribeListener(key, listener) {
    return this.cache.subscribeListener(key, listener);
  }
  subscribe(key) {
    this.cache.subscribe(key);
  }
  unsubscribe(key, gcTime) {
    this.cache.unsubscribe(key, gcTime);
  }
  // 구현
  async prefetchQuery(keyOrQuery, fetchFnOrParams) {
    if (typeof keyOrQuery === "object" && keyOrQuery && "cacheKey" in keyOrQuery) {
      const query = keyOrQuery;
      const params = fetchFnOrParams;
      const cacheKey = query.cacheKey(params);
      const fetchFn2 = async () => {
        let data2;
        if (query.queryFn) {
          data2 = await query.queryFn(params, this.fetcher);
        } else if (query.url) {
          const url = query.url(params);
          const response = await this.fetcher.get(url, query.fetchConfig);
          data2 = response.data;
        } else {
          throw new Error(
            "Either 'url' or 'queryFn' must be provided in QueryConfig"
          );
        }
        if (query.schema) {
          data2 = query.schema.parse(data2);
        }
        if (query.select) {
          data2 = query.select(data2);
        }
        return data2;
      };
      return this.prefetchQuery(cacheKey, fetchFn2);
    }
    const key = keyOrQuery;
    const fetchFn = fetchFnOrParams;
    const data = await fetchFn();
    this.set(key, {
      data,
      error: void 0,
      isLoading: false,
      isFetching: false,
      updatedAt: Date.now()
    });
    return data;
  }
  dehydrate() {
    return this.cache.serialize();
  }
  hydrate(cache) {
    this.cache.deserialize(cache);
  }
  /**
   * 캐시 통계를 반환합니다. (디버깅 목적)
   *
   * @description 성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
   */
  getQueryCache() {
    return this.cache;
  }
};

// src/query/client/query-client-manager.ts
var globalQueryClient = void 0;
var defaultOptions = void 0;
function setDefaultQueryClientOptions(options2) {
  defaultOptions = options2;
  if (typeof window !== "undefined" && globalQueryClient) {
    globalQueryClient = void 0;
  }
}
function createQueryClientWithSetup(options2) {
  if (!options2?.setupInterceptors) {
    return new QueryClient(options2);
  }
  const { setupInterceptors, ...clientOptions } = options2;
  const client = new QueryClient(clientOptions);
  setupInterceptors(client.getFetcher());
  return client;
}
function getQueryClient(options2) {
  const finalOptions = options2 || defaultOptions;
  if (typeof window === "undefined") {
    return createQueryClientWithSetup(finalOptions);
  }
  if (!globalQueryClient) {
    globalQueryClient = createQueryClientWithSetup(finalOptions);
  }
  return globalQueryClient;
}
function resetQueryClient() {
  if (typeof window !== "undefined") {
    globalQueryClient = void 0;
  }
}
function createQueryClientWithInterceptors(options2, setupInterceptors) {
  return createQueryClientWithSetup({
    ...options2,
    setupInterceptors
  });
}
function replaceEqualDeep(prev, next) {
  if (prev === next) {
    return prev;
  }
  if (isEqual(prev, next)) {
    return prev;
  }
  if (prev == null || next == null) {
    return next;
  }
  if (isArray(prev) && isArray(next)) {
    if (prev.length !== next.length) {
      return next;
    }
    let hasChanged = false;
    const result = prev.map((item, index) => {
      const nextItem = replaceEqualDeep(item, next[index]);
      if (nextItem !== item) {
        hasChanged = true;
      }
      return nextItem;
    });
    return hasChanged ? result : prev;
  }
  if (isArray(prev) !== isArray(next)) {
    return next;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const prevObj = prev;
    const nextObj = next;
    const prevKeys = keys(prevObj);
    const nextKeys = keys(nextObj);
    if (prevKeys.length !== nextKeys.length) {
      return next;
    }
    let hasChanged = false;
    const result = {};
    for (const key of nextKeys) {
      if (!(key in prevObj)) {
        return next;
      }
      const prevValue = prevObj[key];
      const nextValue = nextObj[key];
      const optimizedValue = replaceEqualDeep(prevValue, nextValue);
      if (optimizedValue !== prevValue) {
        hasChanged = true;
      }
      result[key] = optimizedValue;
    }
    return hasChanged ? result : prev;
  }
  return next;
}

// src/query/observer/utils/tracked-result.ts
var TrackedResult = class {
  constructor(result) {
    this.trackedProps = /* @__PURE__ */ new Set();
    this.cachedProxy = null;
    this.result = result;
  }
  createProxy() {
    if (this.cachedProxy) {
      return this.cachedProxy;
    }
    this.cachedProxy = new Proxy(this.result, {
      get: (target, prop) => {
        if (typeof prop === "string" && prop in target) {
          this.trackedProps.add(prop);
        }
        return target[prop];
      }
    });
    return this.cachedProxy;
  }
  getTrackedProps() {
    return this.trackedProps;
  }
  hasTrackedProp(prop) {
    return this.trackedProps.has(prop);
  }
  getResult() {
    return this.result;
  }
  // 결과가 변경될 때 캐시 무효화
  updateResult(newResult) {
    this.result = newResult;
    this.cachedProxy = null;
  }
};
var FetchManager = class {
  constructor(queryClient, placeholderManager) {
    this.queryClient = queryClient;
    this.placeholderManager = placeholderManager;
  }
  /**
   * Fetch 실행
   * enabled 옵션과 stale 상태를 확인하여 필요한 경우에만 페칭을 수행합니다.
   */
  async executeFetch(cacheKey, options2, onComplete) {
    const { enabled = true, staleTime = 0 } = options2;
    if (!enabled) return;
    const cached = this.queryClient.get(cacheKey);
    const isStale = cached ? Date.now() - cached.updatedAt >= staleTime : true;
    if (!cached || isStale) {
      await this.fetchData(cacheKey, options2, onComplete);
    }
  }
  /**
   * 데이터 페칭
   * 실제 HTTP 요청을 수행하고 결과를 캐시에 저장합니다.
   */
  async fetchData(cacheKey, options2, onComplete) {
    try {
      const currentState = this.queryClient.get(cacheKey);
      if (currentState && !currentState.isFetching) {
        this.queryClient.set(cacheKey, {
          ...currentState,
          isFetching: true
        });
      }
      const result = await this.performHttpRequest(options2);
      this.placeholderManager.deactivatePlaceholder();
      this.queryClient.set(cacheKey, {
        data: result,
        error: void 0,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now()
      });
      onComplete?.();
    } catch (error) {
      this.placeholderManager.deactivatePlaceholder();
      this.queryClient.set(cacheKey, {
        data: void 0,
        error,
        isLoading: false,
        isFetching: false,
        updatedAt: Date.now()
      });
      onComplete?.();
    }
  }
  /**
   * HTTP 요청 수행
   * 실제 네트워크 요청을 처리하고 스키마 검증을 수행합니다.
   */
  async performHttpRequest(options2) {
    const fetcher = this.queryClient.getFetcher();
    if ("queryFn" in options2 && options2.queryFn) {
      return this.executeQueryFn(options2, fetcher);
    }
    if ("url" in options2 && options2.url) {
      return this.executeUrlRequest(options2, fetcher);
    }
    throw new Error(
      "Invalid QueryObserverOptions: neither 'url' nor 'queryFn' is provided"
    );
  }
  /**
   * queryFn 실행
   * Factory 방식과 Options 방식을 구분하여 적절한 매개변수로 호출
   */
  async executeQueryFn(options2, fetcher) {
    const queryFn = options2.queryFn;
    let result;
    if ("params" in options2 && options2.params !== void 0) {
      result = await queryFn(options2.params, fetcher);
    } else {
      result = await queryFn(fetcher);
    }
    return this.applySchemaValidation(result, options2.schema);
  }
  /**
   * URL 기반 요청 실행
   */
  async executeUrlRequest(options2, fetcher) {
    const url = options2.url;
    const config = this.buildFetchConfig(options2);
    const response = await fetcher.get(url, config);
    return this.applySchemaValidation(response.data, options2.schema);
  }
  /**
   * Fetch 설정 구성
   */
  buildFetchConfig(options2) {
    let config = merge({}, options2.fetchConfig ?? {});
    if (isNotNil(options2.params)) {
      config = merge(config, { params: options2.params });
    }
    if (isNotNil(options2.schema)) {
      config = merge(config, { schema: options2.schema });
    }
    return config;
  }
  /**
   * 스키마 검증 적용
   */
  applySchemaValidation(data, schema) {
    if (schema) {
      return schema.parse(data);
    }
    return data;
  }
  /**
   * 수동 refetch
   * 캐시 키와 옵션을 받아 즉시 데이터를 다시 페칭합니다.
   */
  async refetch(cacheKey, options2, onComplete) {
    await this.fetchData(cacheKey, options2, onComplete);
  }
  /**
   * 페칭 상태 확인
   * 현재 페칭 중인지 확인합니다.
   */
  isFetching(cacheKey) {
    const cached = this.queryClient.get(cacheKey);
    return cached?.isFetching ?? false;
  }
  /**
   * Stale 상태 확인
   * 캐시된 데이터가 stale한지 확인합니다.
   */
  isStale(cacheKey, staleTime = 0) {
    const cached = this.queryClient.get(cacheKey);
    return cached ? Date.now() - cached.updatedAt >= staleTime : true;
  }
};
var OptionsManager = class {
  constructor(queryClient, placeholderManager) {
    this.queryClient = queryClient;
    this.placeholderManager = placeholderManager;
  }
  /**
   * 옵션 해시 생성
   * 해시에 포함할 속성들만 선택하여 JSON 직렬화
   */
  createOptionsHash(options2) {
    const hashableOptions = pick(options2, [
      "key",
      "url",
      "params",
      "enabled",
      "staleTime",
      "gcTime"
      // queryFn은 함수이므로 해시에서 제외 (함수 참조는 항상 다르므로)
    ]);
    return JSON.stringify(hashableOptions);
  }
  /**
   * 옵션 변경 여부 확인
   */
  isOptionsUnchanged(prevHash, newHash) {
    return prevHash === newHash;
  }
  /**
   * 키 변경 여부 확인
   */
  isKeyChanged(prevKey, newKey) {
    return prevKey !== newKey;
  }
  /**
   * 옵션만 업데이트 (키는 동일)
   */
  updateOptionsOnly(options2, callbacks) {
    const hasChanged = callbacks.updateResult();
    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }
  /**
   * 옵션과 키 업데이트
   */
  updateOptionsAndKey(options2, newHash) {
    const cacheKey = serializeQueryKey(options2.key);
    return { cacheKey, optionsHash: newHash };
  }
  /**
   * 키 변경 처리
   */
  handleKeyChange(prevOptions, newCacheKey, callbacks) {
    this.unsubscribeFromPreviousKey(prevOptions);
    this.placeholderManager.deactivatePlaceholder();
    callbacks.subscribeToCache();
    if (this.queryClient.has(newCacheKey)) {
      callbacks.handleCachedDataAvailable();
    } else {
      callbacks.handleNoCachedData();
    }
  }
  /**
   * 옵션 변경 처리 (키는 동일)
   */
  handleOptionsChange(callbacks) {
    const hasChanged = callbacks.updateResult();
    callbacks.executeFetch();
    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }
  /**
   * 이전 키 구독 해제
   */
  unsubscribeFromPreviousKey(prevOptions) {
    this.queryClient.unsubscribe(prevOptions.key, prevOptions.gcTime || 3e5);
  }
  /**
   * Observer 상태 초기화 (PlaceholderData만 처리)
   */
  resetObserverState() {
    this.placeholderManager.deactivatePlaceholder();
  }
  /**
   * 캐시된 데이터 처리 로직
   */
  handleCachedDataAvailable(cacheKey, options2, callbacks) {
    const currentResult = callbacks.computeResult();
    const lastResultReference = currentResult;
    const cached = this.queryClient.get(cacheKey);
    const isStale = cached ? Date.now() - cached.updatedAt >= (options2.staleTime || 0) : true;
    const shouldFetch = isStale && options2.enabled !== false;
    if (shouldFetch && cached) {
      this.queryClient.set(cacheKey, {
        ...cached,
        isFetching: true
      });
      const updatedResult = callbacks.computeResult();
      callbacks.executeFetch();
      callbacks.scheduleNotifyListeners();
      return {
        currentResult: updatedResult,
        lastResultReference: updatedResult
      };
    }
    callbacks.executeFetch();
    callbacks.scheduleNotifyListeners();
    return { currentResult, lastResultReference };
  }
  /**
   * 캐시된 데이터가 없는 경우 처리
   */
  handleNoCachedData(callbacks) {
    const hasChanged = callbacks.updateResult();
    callbacks.executeFetch();
    if (hasChanged) {
      callbacks.scheduleNotifyListeners();
    }
  }
};
var PlaceholderManager = class {
  constructor(queryClient) {
    this.placeholderState = null;
    this.queryClient = queryClient;
  }
  /**
   * placeholderData 계산
   * 캐시와 완전히 독립적으로 처리
   */
  computePlaceholderData(options2) {
    const { placeholderData } = options2;
    if (!placeholderData) return void 0;
    if (!isFunction$2(placeholderData)) {
      return placeholderData;
    }
    const prevQuery = this.findPreviousQuery(options2);
    if (!prevQuery || prevQuery.data === void 0) return void 0;
    return placeholderData(prevQuery.data, prevQuery);
  }
  /**
   * 이전 쿼리 데이터 찾기
   * 같은 타입의 쿼리 중에서 가장 최근에 성공한 쿼리를 찾습니다.
   */
  findPreviousQuery(options2) {
    const allQueries = this.queryClient.getAll();
    const currentKey = options2.key;
    let mostRecentQuery;
    let mostRecentTime = 0;
    for (const [keyStr, state] of Object.entries(allQueries)) {
      try {
        const keyArray = JSON.parse(keyStr);
        if (this.isValidPreviousQuery(keyArray, currentKey, state, options2)) {
          const updatedAt = state.updatedAt || 0;
          if (this.isMoreRecent(updatedAt, mostRecentTime)) {
            mostRecentQuery = state;
            mostRecentTime = updatedAt;
          }
        }
      } catch {
      }
    }
    return mostRecentQuery;
  }
  /**
   * 유효한 이전 쿼리인지 확인
   */
  isValidPreviousQuery(keyArray, currentKey, state, options2) {
    return this.isArrayKey(keyArray, options2) && this.isSameQueryType(keyArray, currentKey) && this.isDifferentQueryKey(keyArray, currentKey) && this.hasValidData(state);
  }
  /**
   * 배열 키인지 확인
   */
  isArrayKey(keyArray, options2) {
    return Array.isArray(keyArray) && Array.isArray(options2.key);
  }
  /**
   * 같은 쿼리 타입인지 확인 (첫 번째 키 요소로 판단)
   */
  isSameQueryType(keyArray, currentKey) {
    return keyArray[0] === currentKey[0];
  }
  /**
   * 다른 쿼리 키인지 확인 (같은 키는 제외)
   */
  isDifferentQueryKey(keyArray, currentKey) {
    return !isEqual(keyArray, currentKey);
  }
  /**
   * 유효한 데이터가 있는지 확인
   */
  hasValidData(state) {
    return state && !isNil$1(state.data);
  }
  /**
   * 더 최근 데이터인지 확인
   */
  isMoreRecent(updatedAt, mostRecentTime) {
    return updatedAt > mostRecentTime;
  }
  /**
   * PlaceholderData가 유효한지 확인
   */
  hasValidPlaceholderData(placeholderData) {
    return !isNil$1(placeholderData);
  }
  /**
   * PlaceholderState 설정
   */
  setPlaceholderState(state) {
    this.placeholderState = state;
  }
  /**
   * PlaceholderState 가져오기
   */
  getPlaceholderState() {
    return this.placeholderState;
  }
  /**
   * PlaceholderData 비활성화 (fetch 성공 또는 실패 시)
   */
  deactivatePlaceholder() {
    this.placeholderState = null;
  }
};
var ResultComputer = class {
  constructor(queryClient, placeholderManager) {
    this.queryClient = queryClient;
    this.placeholderManager = placeholderManager;
  }
  /**
   * 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  computeResult(cacheKey, options2, refetchFn) {
    const { enabled = true } = options2;
    const cached = this.queryClient.get(cacheKey);
    if (!enabled) {
      return this.createDisabledResult(cached, options2, refetchFn);
    }
    if (this.hasCachedData(cached)) {
      return this.createCachedResult(cached, options2, refetchFn);
    }
    const placeholderData = this.placeholderManager.computePlaceholderData(options2);
    if (this.placeholderManager.hasValidPlaceholderData(placeholderData)) {
      return this.createPlaceholderResult(placeholderData, options2, refetchFn);
    }
    return this.createInitialLoadingResult(refetchFn);
  }
  /**
   * 비활성화된 결과 생성 (enabled: false)
   */
  createDisabledResult(cached, options2, refetchFn) {
    if (cached) {
      const finalData = this.applySelect(cached.data, options2);
      const isStale = this.computeStaleTime(cached.updatedAt, options2);
      return {
        data: finalData,
        error: cached.error,
        isLoading: false,
        // enabled: false이므로 로딩하지 않음
        isFetching: false,
        // enabled: false이므로 fetch하지 않음
        isError: !!cached.error,
        isSuccess: this.isSuccessState(cached),
        isStale,
        isPlaceholderData: false,
        refetch: refetchFn
      };
    }
    this.placeholderManager.deactivatePlaceholder();
    return {
      data: void 0,
      error: void 0,
      isLoading: false,
      // enabled: false이므로 로딩하지 않음
      isFetching: false,
      // enabled: false이므로 fetch하지 않음
      isError: false,
      isSuccess: false,
      isStale: true,
      isPlaceholderData: false,
      refetch: refetchFn
    };
  }
  /**
   * 캐시된 데이터가 있는지 확인
   */
  hasCachedData(cached) {
    return !!cached;
  }
  /**
   * 캐시된 결과 생성
   */
  createCachedResult(cached, options2, refetchFn) {
    const finalData = this.applySelect(cached.data, options2);
    const isStale = this.computeStaleTime(cached.updatedAt, options2);
    return {
      data: finalData,
      error: cached.error,
      isLoading: cached.isLoading,
      isFetching: cached.isFetching,
      // 캐시된 상태의 isFetching 값 사용
      isError: !!cached.error,
      isSuccess: this.isSuccessState(cached),
      isStale,
      isPlaceholderData: false,
      // 캐시된 데이터는 항상 false
      refetch: refetchFn
    };
  }
  /**
   * PlaceholderData 결과 생성
   */
  createPlaceholderResult(placeholderData, options2, refetchFn) {
    this.placeholderManager.setPlaceholderState({
      data: placeholderData,
      isActive: true
    });
    const finalData = this.applySelect(placeholderData, options2);
    return {
      data: finalData,
      error: void 0,
      isLoading: false,
      // placeholderData는 success 상태
      isFetching: true,
      // 백그라운드에서 fetch 중
      isError: false,
      isSuccess: true,
      isStale: true,
      isPlaceholderData: true,
      refetch: refetchFn
    };
  }
  /**
   * 초기 로딩 결과 생성
   */
  createInitialLoadingResult(refetchFn) {
    this.placeholderManager.deactivatePlaceholder();
    return {
      data: void 0,
      error: void 0,
      isLoading: true,
      isFetching: true,
      isError: false,
      isSuccess: false,
      isStale: true,
      isPlaceholderData: false,
      refetch: refetchFn
    };
  }
  /**
   * 성공 상태인지 확인
   */
  isSuccessState(cached) {
    return !cached.isLoading && !cached.error && !isNil$1(cached.data);
  }
  /**
   * select 함수 적용
   */
  applySelect(data, options2) {
    if (isNil$1(data) || !options2.select) return data;
    try {
      return options2.select(data);
    } catch {
      return data;
    }
  }
  /**
   * Stale 시간 계산
   */
  computeStaleTime(updatedAt, options2) {
    return updatedAt ? Date.now() - updatedAt >= (options2.staleTime || 0) : true;
  }
};

// src/query/observer/query-observer.ts
var QueryObserver = class {
  constructor(queryClient, options2) {
    this.listeners = /* @__PURE__ */ new Set();
    this.isDestroyed = false;
    this.optionsHash = "";
    // 결과 캐싱으로 불필요한 렌더링 방지
    this.lastResultReference = null;
    // Tracked Properties
    this.trackedResult = null;
    this.queryClient = queryClient;
    this.options = options2;
    this.cacheKey = serializeQueryKey(options2.key);
    this.placeholderManager = new PlaceholderManager(queryClient);
    this.resultComputer = new ResultComputer(
      queryClient,
      this.placeholderManager
    );
    this.fetchManager = new FetchManager(queryClient, this.placeholderManager);
    this.optionsManager = new OptionsManager(
      queryClient,
      this.placeholderManager
    );
    this.optionsHash = this.optionsManager.createOptionsHash(options2);
    this.currentResult = this.computeResult();
    this.subscribeToCache();
    this.executeFetch();
  }
  subscribeToCache() {
    this.queryClient.subscribeListener(this.options.key, () => {
      if (!this.isDestroyed) {
        const hasChanged = this.updateResult();
        if (hasChanged) {
          this.scheduleNotifyListeners();
        }
        this.handlePotentialInvalidation();
      }
    });
    this.queryClient.subscribe(this.options.key);
  }
  /**
   * invalidateQueries로 인한 무효화 감지 및 처리
   * updatedAt이 0이면 invalidateQueries로 인한 무효화로 간주
   */
  handlePotentialInvalidation() {
    const { enabled = true } = this.options;
    if (!enabled) return;
    const cached = this.queryClient.get(this.cacheKey);
    if (cached && cached.updatedAt === 0) {
      if (!cached.isFetching && !cached.isLoading) {
        this.fetchData();
      }
    }
  }
  /**
   * 결과 계산
   * 캐시 상태와 placeholderData를 완전히 분리하여 처리
   */
  computeResult() {
    return this.resultComputer.computeResult(
      this.cacheKey,
      this.options,
      () => this.refetch()
    );
  }
  /**
   * Tracked Properties 기반 결과 업데이트
   * 기본적으로 tracked 모드로 동작
   */
  updateResult() {
    const newResult = this.computeResult();
    const optimizedResult = this.applyStructuralSharing(newResult);
    if (this.hasChangeInTrackedProps(optimizedResult)) {
      this.currentResult = optimizedResult;
      this.lastResultReference = optimizedResult;
      return true;
    }
    return false;
  }
  /**
   * Structural Sharing 적용
   */
  applyStructuralSharing(newResult) {
    if (!this.lastResultReference) {
      return newResult;
    }
    return replaceEqualDeep(this.lastResultReference, newResult);
  }
  hasChangeInTrackedProps(newResult) {
    if (this.isInitialState()) {
      return true;
    }
    const trackedProps = this.trackedResult.getTrackedProps();
    if (this.hasNoTrackedProperties(trackedProps)) {
      return true;
    }
    return this.hasTrackedPropertyChanged(trackedProps, newResult);
  }
  isInitialState() {
    return !this.lastResultReference || !this.trackedResult;
  }
  hasNoTrackedProperties(trackedProps) {
    return isEmpty(trackedProps);
  }
  hasTrackedPropertyChanged(trackedProps, newResult) {
    for (const prop of trackedProps) {
      if (this.lastResultReference[prop] !== newResult[prop]) {
        return true;
      }
    }
    return false;
  }
  async executeFetch() {
    await this.fetchManager.executeFetch(this.cacheKey, this.options);
  }
  async fetchData() {
    await this.fetchManager.fetchData(this.cacheKey, this.options, () => {
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
    });
  }
  notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
  /**
   * 결과 구독 (React 컴포넌트에서 사용)
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /**
   * Tracked Properties가 적용된 현재 결과 반환
   * TrackedResult 인스턴스를 재사용하여 속성 추적을 유지
   */
  getCurrentResult() {
    if (!this.trackedResult) {
      this.trackedResult = new TrackedResult(this.currentResult);
    } else if (this.trackedResult.getResult() !== this.currentResult) {
      this.trackedResult.updateResult(this.currentResult);
    }
    return this.trackedResult.createProxy();
  }
  /**
   * 수동 refetch
   */
  refetch() {
    this.fetchManager.refetch(this.cacheKey, this.options, () => {
      const hasChanged = this.updateResult();
      if (hasChanged) {
        this.scheduleNotifyListeners();
      }
    });
  }
  /**
   * 옵션 업데이트 최적화
   */
  setOptions(options2) {
    const prevKey = this.cacheKey;
    const prevHash = this.optionsHash;
    const newHash = this.optionsManager.createOptionsHash(options2);
    if (this.optionsManager.isOptionsUnchanged(prevHash, newHash)) {
      this.options = options2;
      this.optionsManager.updateOptionsOnly(options2, this.createCallbacks());
      return;
    }
    const prevOptions = this.options;
    const { cacheKey, optionsHash } = this.optionsManager.updateOptionsAndKey(
      options2,
      newHash
    );
    this.options = options2;
    this.cacheKey = cacheKey;
    this.optionsHash = optionsHash;
    if (this.optionsManager.isKeyChanged(prevKey, this.cacheKey)) {
      this.trackedResult = null;
      this.optionsManager.handleKeyChange(
        prevOptions,
        this.cacheKey,
        this.createCallbacks()
      );
    } else {
      this.optionsManager.handleOptionsChange(this.createCallbacks());
    }
  }
  createCallbacks() {
    return {
      updateResult: () => this.updateResult(),
      scheduleNotifyListeners: () => this.scheduleNotifyListeners(),
      executeFetch: () => this.executeFetch(),
      subscribeToCache: () => this.subscribeToCache(),
      computeResult: () => this.computeResult(),
      handleCachedDataAvailable: () => this.handleCachedDataAvailable(),
      handleNoCachedData: () => this.handleNoCachedData()
    };
  }
  handleCachedDataAvailable() {
    this.currentResult = this.computeResult();
    this.lastResultReference = this.currentResult;
    const cached = this.queryClient.get(this.cacheKey);
    const isStale = cached ? Date.now() - cached.updatedAt >= (this.options.staleTime || 0) : true;
    const shouldFetch = isStale && this.options.enabled !== false;
    if (shouldFetch && cached) {
      this.queryClient.set(this.cacheKey, {
        ...cached,
        isFetching: true
      });
      this.currentResult = this.computeResult();
      this.lastResultReference = this.currentResult;
    }
    this.executeFetch();
    this.scheduleNotifyListeners();
  }
  handleNoCachedData() {
    const hasChanged = this.updateResult();
    this.executeFetch();
    if (hasChanged) {
      this.scheduleNotifyListeners();
    }
  }
  scheduleNotifyListeners() {
    Promise.resolve().then(() => {
      if (!this.isDestroyed) {
        this.notifyListeners();
      }
    });
  }
  /**
   * Observer 정리
   */
  destroy() {
    this.isDestroyed = true;
    this.queryClient.unsubscribe(
      this.options.key,
      this.options.gcTime || 3e5
    );
    this.listeners.clear();
    this.placeholderManager.deactivatePlaceholder();
    this.lastResultReference = null;
    this.trackedResult = null;
  }
};
async function ssrPrefetch(queries, globalFetchConfig = {}, client) {
  const queryClient = client || getQueryClient();
  const results = await Promise.allSettled(
    queries.map(async (queryItem) => {
      try {
        const [query, params] = queryItem;
        const mergedQuery = {
          ...query,
          fetchConfig: merge({}, globalFetchConfig, query.fetchConfig || {})
        };
        await queryClient.prefetchQuery(mergedQuery, params);
      } catch (error) {
        console.error(`[ssrPrefetch] Failed to prefetch query:`, error);
      }
    })
  );
  const failures = results.filter(
    (result) => result.status === "rejected"
  );
  if (failures.length > 0) {
    console.warn(`[ssrPrefetch] ${failures.length} queries failed to prefetch`);
  }
  return queryClient.dehydrate();
}

export { ContentType, ErrorCode, FetchError, QueryClient, QueryObserver, ResponseType, createError, createFetch, createMutationFactory, createQueryClientWithInterceptors, createQueryFactory, fetch_default as defaultInstance, del, errorToResponse, get, getHeaders, getQueryClient, getStatus, handleFetchError, handleHttpError, hasErrorCode, hasStatus, head, interceptorTypes, interceptors, isFetchError, ntFetch, options, patch, post, put, request, resetQueryClient, setDefaultQueryClientOptions, ssrPrefetch, unwrap, validateMutationConfig, validateQueryConfig };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map