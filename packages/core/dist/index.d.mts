import { z, ZodType } from 'zod/v4';

/**
 * 컨텐츠 타입 열거형
 */
declare enum ContentType {
    /**
     * JSON 데이터 (application/json)
     */
    JSON = "application/json",
    /**
     * URL 인코딩된 폼 데이터 (application/x-www-form-urlencoded)
     */
    FORM = "application/x-www-form-urlencoded",
    /**
     * 일반 텍스트 (text/plain)
     */
    TEXT = "text/plain",
    /**
     * 바이너리 데이터 (application/octet-stream)
     */
    BLOB = "application/octet-stream",
    /**
     * 멀티파트 폼 데이터 (multipart/form-data)
     */
    MULTIPART = "multipart/form-data",
    /**
     * XML 문서 (application/xml)
     */
    XML = "application/xml",
    /**
     * HTML 문서 (text/html)
     */
    HTML = "text/html"
}
/**
 * 응답 타입 열거형
 */
declare enum ResponseType {
    /**
     * JSON 응답 (자동 파싱)
     */
    JSON = "json",
    /**
     * 텍스트 응답 (text/plain, HTML, XML 등)
     */
    TEXT = "text",
    /**
     * Blob 응답 (이미지, 파일 등 바이너리 데이터)
     */
    BLOB = "blob",
    /**
     * ArrayBuffer 응답 (바이너리 데이터)
     */
    ARRAY_BUFFER = "arraybuffer",
    /**
     * 원시 응답 (Response 객체 그대로 반환)
     */
    RAW = "raw"
}
/**
 * HTTP 메서드 타입
 */
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
/**
 * HTTP 에러 클래스
 */
declare class FetchError extends Error {
    /**
     * 에러 이름
     */
    name: string;
    /**
     * 에러 코드
     */
    code?: string;
    /**
     * 응답 정보 (HTTP 에러인 경우)
     */
    response?: {
        data: unknown;
        status: number;
        statusText: string;
        headers: Headers;
    };
    /**
     * 요청 객체
     */
    request?: Request;
    /**
     * 요청 설정
     */
    config: RequestConfig;
    /**
     * FetchError 생성자
     * @param message 에러 메시지
     * @param config 요청 설정
     * @param code 에러 코드
     * @param request 요청 객체
     * @param response 응답 객체
     * @param responseData 응답 데이터
     */
    constructor(message: string, config: RequestConfig, code?: string, request?: Request, response?: Response, responseData?: unknown);
}
/**
 * 401 인증 오류 자동 재시도 옵션
 */
interface AuthRetryOption {
    /**
     * 최대 재시도 횟수 (기본값: 1)
     */
    limit?: number;
    /**
     * 재시도할 HTTP 상태 코드 목록 (기본값: [401])
     * 커스텀 상태 코드(예: 401004 등)도 지정 가능
     */
    statusCodes?: number[];
    /**
     * 재시도 전 실행할 핸들러 (true 반환 시 재시도)
     */
    handler: (error: FetchError, config: RequestConfig) => Promise<boolean>;
    /**
     * 커스텀 재시도 조건 함수 (true 반환 시 handler 실행)
     * 상태코드 외에 추가 조건이 필요할 때 사용
     */
    shouldRetry?: (error: FetchError, config: RequestConfig) => boolean;
}
/**
 * 기본 설정 옵션 인터페이스
 */
interface FetchConfig extends Omit<RequestInit, "signal" | "headers" | "body" | "method"> {
    /**
     * 기본 URL
     */
    baseURL?: string;
    /**
     * 요청 타임아웃 (ms)
     */
    timeout?: number;
    /**
     * 요청 헤더
     */
    headers?: Record<string, string>;
    /**
     * 요청 쿼리 파라미터
     */
    params?: Record<string, string | number | boolean | undefined | null>;
    /**
     * 자동 재시도 설정
     */
    retry?: number | {
        limit: number;
        statusCodes?: number[];
        backoff?: "linear" | "exponential" | ((retryCount: number) => number);
    };
    /**
     * 응답을 JSON으로 파싱 여부
     * @deprecated responseType을 사용하세요
     */
    parseJSON?: boolean;
    /**
     * 응답 데이터 검증을 위한 Zod 스키마
     */
    schema?: z.ZodType;
    /**
     * Next.js fetch 옵션
     */
    next?: {
        /**
         * 재검증 시간(초)
         */
        revalidate?: number | false;
        /**
         * 태그 기반 재검증을 위한 태그 배열
         */
        tags?: string[];
    };
    /**
     * 요청 취소를 위한 AbortSignal
     * 외부에서 AbortController를 통해 요청을 취소할 수 있습니다.
     */
    signal?: AbortSignal;
    /**
     * 컨텐츠 타입 설정
     * 요청 본문의 Content-Type을 지정합니다.
     */
    contentType?: ContentType | string;
    /**
     * 응답 타입 설정
     * 서버 응답을 어떻게 파싱할지 지정합니다.
     */
    responseType?: ResponseType;
    /**
     * 401 인증 오류 자동 재시도 옵션
     */
    authRetry?: AuthRetryOption;
}
/**
 * 특정 요청에 대한 설정 인터페이스
 */
interface RequestConfig extends FetchConfig {
    /**
     * 요청 URL
     */
    url?: string;
    /**
     * HTTP 메서드
     */
    method?: HttpMethod;
    /**
     * 요청 본문
     */
    data?: unknown;
    /**
     * 내부용: 401 재시도 카운트
     */
    _authRetryCount?: number;
}
/**
 * 응답 객체 인터페이스
 */
interface NextTypeResponse<T = unknown> {
    /**
     * 서버 응답 데이터
     */
    data: T;
    /**
     * HTTP 상태 코드
     */
    status: number;
    /**
     * HTTP 상태 메시지
     */
    statusText: string;
    /**
     * 응답 헤더
     */
    headers: Headers;
    /**
     * 요청 설정
     */
    config: RequestConfig;
    /**
     * 요청 객체
     */
    request?: Request;
}
/**
 * 인터셉터 핸들러 타입
 */
type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
type ResponseInterceptor = (response: NextTypeResponse) => Promise<NextTypeResponse> | NextTypeResponse;
type ErrorInterceptor = (error: FetchError) => Promise<NextTypeResponse | FetchError> | NextTypeResponse | FetchError;
/**
 * 쿼리 키 타입
 * 일반적으로 문자열 또는 문자열/숫자/불리언 등으로 구성된 배열입니다.
 */
type QueryKey = string | readonly unknown[];
/**
 * 인터셉터 핸들러와 제거 함수를 함께 반환하는 타입
 */
interface InterceptorHandle {
    /**
     * 인터셉터 제거 함수
     */
    remove: () => void;
}
/**
 * 인터셉터 인터페이스
 */
interface Interceptors {
    request: {
        use: (interceptor: RequestInterceptor) => InterceptorHandle;
        eject: (id: number) => void;
        clearByType: (type: symbol) => void;
        clear: () => void;
    };
    response: {
        use: (onFulfilled: ResponseInterceptor) => InterceptorHandle;
        eject: (id: number) => void;
        clearByType: (type: symbol) => void;
        clear: () => void;
    };
    error: {
        use: (onRejected: ErrorInterceptor) => InterceptorHandle;
        eject: (id: number) => void;
        clearByType: (type: symbol) => void;
        clear: () => void;
    };
}
/**
 * 취소 가능한 요청 타입
 */
interface CancelablePromise<T> extends Promise<T> {
    /**
     * 요청 취소 메서드
     */
    cancel: () => void;
    /**
     * 요청 취소 여부 확인
     */
    isCanceled: () => boolean;
}
/**
 * Next Type Fetch 인스턴스 인터페이스
 */
interface NextTypeFetch {
    /**
     * 전역 설정
     */
    defaults: FetchConfig;
    /**
     * 인터셉터
     */
    interceptors: Interceptors;
    /**
     * GET 요청
     */
    get: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * POST 요청
     */
    post: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * PUT 요청
     */
    put: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * DELETE 요청
     */
    delete: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * PATCH 요청
     */
    patch: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * HEAD 요청
     */
    head: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * OPTIONS 요청
     */
    options: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
    /**
     * 기본 요청 메서드
     */
    request: <T = unknown>(config: RequestConfig) => CancelablePromise<NextTypeResponse<T>>;
}

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
declare function isFetchError(error: unknown): error is FetchError;
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
declare function hasErrorCode(error: unknown, code: string): boolean;
/**
 * FetchError 에러 코드 상수
 */
declare const ErrorCode: {
    /** 네트워크 에러 */
    readonly NETWORK: "ERR_NETWORK";
    /** 요청 취소됨 */
    readonly CANCELED: "ERR_CANCELED";
    /** 요청 타임아웃 */
    readonly TIMEOUT: "ERR_TIMEOUT";
    /** 서버 응답 에러 (4xx, 5xx) */
    readonly BAD_RESPONSE: "ERR_BAD_RESPONSE";
    /** 데이터 검증 실패 */
    readonly VALIDATION: "ERR_VALIDATION";
    /** 알 수 없는 검증 오류 */
    readonly VALIDATION_UNKNOWN: "ERR_VALIDATION_UNKNOWN";
    /** 알 수 없는 에러 */
    readonly UNKNOWN: "ERR_UNKNOWN";
};
/**
 * FetchError 에러 코드 타입
 */
type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
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
declare function handleFetchError<T>(error: unknown, handlers: {
    [code in ErrorCodeType]?: (error: FetchError) => T;
} & {
    default?: (error: unknown) => T;
}): T;
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
declare function handleHttpError<T>(error: unknown, handlers: {
    [status: number]: (error: FetchError) => T;
    default?: (error: unknown) => T;
}): T;
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
declare function errorToResponse<T>(error: FetchError, data: T): NextTypeResponse<T>;

/**
 * Next.js App Router와 함께 사용할 수 있는 타입 안전한 fetch 클라이언트를 생성합니다.
 * @param defaultConfig 기본 설정
 * @returns fetch 클라이언트 인스턴스
 */
declare function createFetch(defaultConfig?: FetchConfig): NextTypeFetch;

/**
 * 응답 객체에서 데이터를 추출합니다.
 * @param response NextTypeResponse 객체
 * @returns 데이터
 */
declare function unwrap<T>(response: NextTypeResponse<T>): T;
/**
 * 응답 객체에서 상태 코드를 추출합니다.
 * @param response NextTypeResponse 객체
 * @returns HTTP 상태 코드
 */
declare function getStatus<T>(response: NextTypeResponse<T>): number;
/**
 * 응답 객체에서 헤더를 추출합니다.
 * @param response NextTypeResponse 객체
 * @returns 응답 헤더
 */
declare function getHeaders<T>(response: NextTypeResponse<T>): Headers;
/**
 * 응답 객체가 특정 상태 코드인지 확인합니다.
 * @param response NextTypeResponse 객체
 * @param code HTTP 상태 코드
 * @returns 상태 코드 일치 여부
 */
declare function hasStatus<T>(response: NextTypeResponse<T>, code: number): boolean;
/**
 * HTTP 에러를 생성합니다.
 * @param message 에러 메시지
 * @param config 요청 설정
 * @param code 에러 코드
 * @param response 응답 객체 (선택적)
 * @param data 응답 데이터 (선택적)
 * @returns FetchError 인스턴스
 */
declare function createError(message: string, config: RequestConfig, code?: string, response?: Response, data?: unknown): FetchError;

declare const interceptorTypes: {
    default: symbol;
    auth: symbol;
    logging: symbol;
    errorHandler: symbol;
};

/**
 * 기본 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const request: <T = unknown>(config: RequestConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * GET 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const get: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * POST 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const post: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * PUT 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const put: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * DELETE 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const del: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * PATCH 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const patch: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * HEAD 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const head: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * OPTIONS 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
declare const options: <T = unknown>(url: string, config?: FetchConfig) => CancelablePromise<NextTypeResponse<T>>;
/**
 * 기본 설정 - 전역 설정 변경 가능
 * 라이브러리 이름(Next Type Fetch)의 약자를 사용한 고유명사
 */
declare const ntFetch: FetchConfig;
/**
 * 인터셉터 - 전역 인터셉터 설정 가능
 */
declare const interceptors: Interceptors;
/**
 * 기본 인스턴스 - 모든 메서드 포함
 */
declare const _default: NextTypeFetch;

/**
 * 쿼리 상태 타입
 */
type QueryState<T = unknown> = {
    data?: T;
    error?: unknown;
    isLoading: boolean;
    isFetching: boolean;
    updatedAt: number;
};
/**
 * QueryCache 옵션
 */
interface QueryCacheOptions {
    /**
     * 메모리 보호를 위한 최대 쿼리 수 (하드 리미트)
     * 이 수를 초과하면 LRU(Least Recently Used) 알고리즘으로 가장 오래된 쿼리부터 즉시 제거됩니다.
     * gcTime과는 별개로 동작하며, 메모리 사용량을 제한하는 안전장치 역할을 합니다.
     * @default 1000
     */
    maxQueries?: number;
}
/**
 * 쿼리 캐시 클래스
 *
 * 두 가지 캐시 전략을 사용합니다:
 * 1. **메모리 보호 (Hard Limit)**: maxQueries로 설정된 수를 초과하면 LRU 알고리즘으로 즉시 제거
 * 2. **생명주기 관리 (Soft Limit)**: 구독자가 0이 된 후 gcTime 시간이 지나면 가비지 컬렉션으로 제거
 */
declare class QueryCache {
    private cache;
    private subscribers;
    private listeners;
    private gcTimers;
    constructor(options?: QueryCacheOptions);
    /**
     * 특정 키의 메타데이터를 정리합니다.
     */
    private cleanupMetadata;
    set(key: string | readonly unknown[], state: QueryState): void;
    get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined;
    has(key: string | readonly unknown[]): boolean;
    delete(key: string | readonly unknown[]): void;
    clear(): void;
    getAll(): Record<string, QueryState>;
    /**
     * 컴포넌트가 쿼리를 구독하여 refetch 콜백을 등록합니다.
     * @returns unsubscribe 함수
     */
    subscribeListener(key: string | readonly unknown[], listener: () => void): () => void;
    /**
     * 특정 쿼리 키의 모든 리스너에게 알림을 보냅니다.
     */
    notifyListeners(key: string | readonly unknown[]): void;
    /**
     * 구독자 수 증가 및 gcTime 타이머 해제 (생명주기 관리)
     */
    subscribe(key: string | readonly unknown[]): void;
    /**
     * 구독자 수 감소 및 0이 되면 gcTime 타이머 시작 (생명주기 관리)
     */
    unsubscribe(key: string | readonly unknown[], gcTime: number): void;
    serialize(): Record<string, QueryState>;
    deserialize(cache: Record<string, QueryState>): void;
    /**
     * 현재 캐시 크기를 반환합니다.
     */
    get size(): number;
    /**
     * 캐시의 최대 크기를 반환합니다.
     */
    get maxSize(): number;
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
    getStats(): {
        /** 현재 캐시된 쿼리 수 */
        cacheSize: number;
        /** 최대 쿼리 수 (메모리 보호 한계) */
        maxSize: number;
        /** 활성 구독자 수 */
        subscribersCount: number;
        /** 등록된 리스너 수 */
        listenersCount: number;
        /** 활성 GC 타이머 수 (생명주기 관리 중인 쿼리) */
        activeGcTimersCount: number;
    };
}

/**
 * 기본 Query 설정 (공통 속성)
 */
interface BaseQueryConfig<Params = void, Schema extends ZodType = ZodType> {
    cacheKey: (params?: Params) => readonly unknown[];
    schema?: Schema;
    placeholderData?: any | ((prev?: any, prevQuery?: QueryState<any>) => any);
    fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
    select?: (data: any) => any;
    enabled?: boolean | ((params?: Params) => boolean);
}
/**
 * URL 기반 Query 설정
 */
interface UrlBasedQueryConfig<Params = void, Schema extends ZodType = ZodType> extends BaseQueryConfig<Params, Schema> {
    /**
     * API 요청 URL을 생성하는 함수
     */
    url: (params?: Params) => string;
    /**
     * queryFn이 있으면 안됨 (상호 배제)
     */
    queryFn?: never;
}
/**
 * Custom Function 기반 Query 설정
 */
interface FunctionBasedQueryConfig<Params = void, Schema extends ZodType = ZodType> extends BaseQueryConfig<Params, Schema> {
    /**
     * Custom query function for complex requests
     * 복잡한 요청을 처리할 수 있는 사용자 정의 함수
     */
    queryFn: (params: Params, fetcher: NextTypeFetch) => Promise<any>;
    /**
     * url이 있으면 안됨 (상호 배제)
     */
    url?: never;
}
/**
 * Query를 정의하기 위한 설정 객체 인터페이스
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
type QueryConfig<Params = void, Schema extends ZodType = ZodType> = UrlBasedQueryConfig<Params, Schema> | FunctionBasedQueryConfig<Params, Schema>;
type QueryFactoryInput = Record<string, QueryConfig<any, any>>;
type ExtractParams<T> = T extends QueryConfig<infer P, any> ? P : never;
/**
 * Query 설정의 유효성을 검증
 * QueryConfig와 UseQueryOptions 모두 지원
 */
declare function validateQueryConfig(config: QueryConfig<any, any> | any): void;
declare function createQueryFactory<T extends QueryFactoryInput>(defs: T): T;

/**
 * Zod 스키마가 명확히 있을 때만 z.infer<T>를 사용, 아니면 Fallback
 */
type InferIfZodSchema<T, Fallback> = [T] extends [ZodType] ? z.infer<T> : Fallback;
/**
 * 기본 Mutation 설정 (url + method 방식)
 */
interface BaseMutationConfig<TVariables = any, TData = any, TError = Error, TContext = unknown, RequestSchema extends ZodType = never, ResponseSchema extends ZodType = never> {
    /**
     * Mutation을 식별하는 캐시 키입니다. (선택적)
     * Devtools 등에서 사용될 수 있습니다.
     */
    cacheKey?: QueryKey;
    /**
     * 요청 본문의 유효성 검사를 위한 Zod 스키마입니다. (선택적)
     */
    requestSchema?: RequestSchema;
    /**
     * 응답 데이터의 유효성 검사를 위한 Zod 스키마입니다. (선택적)
     * 이 스키마로 파싱된 데이터가 TData 타입이 됩니다.
     */
    responseSchema?: ResponseSchema;
    /**
     * Mutation 함수 실행 전 호출되는 콜백입니다. (선택적)
     * 컨텍스트를 반환하여 onSuccess, onError, onSettled에서 사용할 수 있습니다.
     */
    onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
    /**
     * Mutation 성공 시 호출되는 콜백입니다. (선택적)
     */
    onSuccess?: (data: InferIfZodSchema<ResponseSchema, TData>, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    /**
     * Mutation 실패 시 호출되는 콜백입니다. (선택적)
     */
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    /**
     * Mutation 성공 또는 실패 여부와 관계없이 항상 호출되는 콜백입니다. (선택적)
     */
    onSettled?: (data: InferIfZodSchema<ResponseSchema, TData> | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    /**
     * Mutation 성공 시 무효화할 쿼리 키 목록 또는 동적으로 키 목록을 반환하는 함수입니다. (선택적)
     */
    invalidateQueries?: QueryKey[] | ((data: InferIfZodSchema<ResponseSchema, TData>, variables: TVariables, context: TContext | undefined) => QueryKey[]);
    /**
     * 이 Mutation에만 적용될 특정 fetch 설정을 지정합니다. (선택적)
     * baseURL, timeout, headers 등이 포함될 수 있습니다.
     */
    fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data" | "schema">;
}
/**
 * URL + Method 기반 Mutation 설정
 */
interface UrlBasedMutationConfig<TVariables = any, TData = any, TError = Error, TContext = unknown, RequestSchema extends ZodType = never, ResponseSchema extends ZodType = never> extends BaseMutationConfig<TVariables, TData, TError, TContext, RequestSchema, ResponseSchema> {
    /**
     * API 요청 URL을 생성하는 함수 또는 문자열입니다.
     * TVariables를 인자로 받아 URL 문자열을 반환합니다.
     */
    url: string | ((variables: TVariables) => string);
    /**
     * HTTP 요청 메서드입니다. (예: "POST", "PUT", "DELETE")
     */
    method: HttpMethod;
    /**
     * mutationFn이 있으면 안됨
     */
    mutationFn?: never;
}
/**
 * Custom Function 기반 Mutation 설정
 */
interface FunctionBasedMutationConfig<TVariables = any, TData = any, TError = Error, TContext = unknown, RequestSchema extends ZodType = never, ResponseSchema extends ZodType = never> extends BaseMutationConfig<TVariables, TData, TError, TContext, RequestSchema, ResponseSchema> {
    /**
     * 사용자 정의 mutation 함수입니다.
     * variables와 fetcher를 인자로 받아 복잡한 로직을 처리할 수 있습니다.
     */
    mutationFn: (variables: TVariables, fetcher: NextTypeFetch) => Promise<InferIfZodSchema<ResponseSchema, TData>>;
    /**
     * url/method가 있으면 안됨
     */
    url?: never;
    method?: never;
}
/**
 * Mutation을 정의하기 위한 설정 객체 인터페이스입니다.
 * URL + Method 방식 또는 Custom Function 방식 중 하나를 선택할 수 있습니다.
 */
type MutationConfig<TVariables = any, TData = any, TError = Error, TContext = unknown, RequestSchema extends ZodType = never, ResponseSchema extends ZodType = never> = UrlBasedMutationConfig<TVariables, TData, TError, TContext, RequestSchema, ResponseSchema> | FunctionBasedMutationConfig<TVariables, TData, TError, TContext, RequestSchema, ResponseSchema>;
/**
 * MutationFactory에 전달될 입력 타입입니다.
 * 각 키는 특정 mutation을 나타내며, 값은 해당 mutation의 MutationConfig입니다.
 */
type MutationFactoryInput = Record<string, MutationConfig<any, any, any, any, any, any>>;
/**
 * MutationConfig에서 TVariables 타입을 추출합니다.
 */
type ExtractMutationVariables<T> = T extends MutationConfig<infer V, any, any, any, any, any> ? V : never;
/**
 * MutationConfig에서 TData 타입을 추출합니다.
 * responseSchema가 있으면 해당 스키마의 추론 타입을, 없으면 TData를 사용합니다.
 */
type ExtractMutationData<T> = T extends MutationConfig<any, infer D, any, any, any, infer RS> ? [RS] extends [ZodType] ? z.infer<RS> : D : never;
/**
 * MutationConfig에서 TError 타입을 추출합니다.
 */
type ExtractMutationError<T> = T extends MutationConfig<any, any, infer E, any, any, any> ? E : Error;
/**
 * Mutation 설정의 유효성을 검증
 */
declare function validateMutationConfig(config: MutationConfig<any, any, any, any, any, any>): void;
/**
 * Mutation 정의 객체를 받아 그대로 반환하는 팩토리 함수입니다.
 * 타입 추론을 돕고, 중앙에서 mutation들을 관리할 수 있게 합니다.
 * @param defs Mutation 정의 객체
 * @returns 전달된 Mutation 정의 객체
 */
declare function createMutationFactory<T extends MutationFactoryInput>(defs: T): T;

interface QueryClientOptions extends FetchConfig {
    fetcher?: NextTypeFetch;
    /**
     * QueryCache 옵션
     */
    queryCache?: QueryCacheOptions;
}
declare class QueryClient {
    private cache;
    private fetcher;
    constructor(options?: QueryClientOptions);
    has(key: string | readonly unknown[]): boolean;
    getFetcher(): NextTypeFetch;
    /**
     * 쿼리 상태 조회
     */
    get<T = unknown>(key: string | readonly unknown[]): QueryState<T> | undefined;
    /**
     * 쿼리 상태 저장
     */
    set(key: string | readonly unknown[], state: QueryState): void;
    /**
     * 쿼리 데이터만 업데이트 (optimistic update에 최적화)
     * 기존 상태(isLoading, isFetching, error)를 유지하면서 data와 updatedAt만 업데이트
     */
    setQueryData<T = unknown>(key: string | readonly unknown[], updater: T | ((oldData: T | undefined) => T | undefined)): void;
    /**
     * 쿼리 상태 삭제
     */
    delete(key: string | readonly unknown[]): void;
    /**
     * 모든 쿼리 상태 반환
     */
    getAll(): Record<string, QueryState>;
    /**
     * 모든 쿼리 상태 초기화
     */
    clear(): void;
    /**
     * 특정 쿼리키(혹은 prefix)로 시작하는 모든 쿼리 캐시를 무효화(삭제)
     * 예: invalidateQueries(['user']) → ['user', ...]로 시작하는 모든 캐시 삭제
     */
    invalidateQueries(prefix: string | readonly unknown[]): void;
    /**
     * 구독자 관리 (public)
     */
    subscribeListener(key: string | readonly unknown[], listener: () => void): () => void;
    subscribe(key: string | readonly unknown[]): void;
    unsubscribe(key: string | readonly unknown[], gcTime: number): void;
    prefetchQuery<T = unknown>(key: string | readonly unknown[], fetchFn: () => Promise<T>): Promise<T>;
    prefetchQuery<T = unknown>(query: QueryConfig<any, any>, params: any): Promise<T>;
    dehydrate(): Record<string, QueryState>;
    hydrate(cache: Record<string, QueryState>): void;
    /**
     * 캐시 통계를 반환합니다. (디버깅 목적)
     *
     * @description 성능 분석, 메모리 사용량 추적, 캐시 상태 확인 등에 활용할 수 있습니다.
     */
    getQueryCache(): QueryCache;
}

/**
 * 인터셉터 설정 함수 타입
 */
type InterceptorSetupFunction = (fetcher: NextTypeFetch) => void;
/**
 * 인터셉터 설정을 포함한 QueryClient 옵션
 */
interface QueryClientOptionsWithInterceptors extends QueryClientOptions {
    /**
     * 인터셉터 설정 함수
     * fetcher 인스턴스를 받아서 인터셉터를 등록하는 함수
     */
    setupInterceptors?: InterceptorSetupFunction;
}
/**
 * 기본 QueryClient 옵션을 설정합니다.
 * 앱 시작 시 한 번만 호출하면 됩니다.
 *
 * @internal React의 configureQueryClient를 사용하는 것을 권장합니다.
 */
declare function setDefaultQueryClientOptions(options: QueryClientOptionsWithInterceptors): void;
/**
 * 환경에 맞는 QueryClient를 자동으로 반환합니다.
 * - 서버 환경: 항상 새로운 인스턴스 생성 (요청 격리)
 * - 클라이언트 환경: 싱글톤 패턴 사용 (상태 유지)
 */
declare function getQueryClient(options?: QueryClientOptionsWithInterceptors): QueryClient;
/**
 * 클라이언트 환경에서 전역 QueryClient를 재설정합니다.
 * 주로 테스트나 특수한 경우에 사용됩니다.
 */
declare function resetQueryClient(): void;
/**
 * 인터셉터 설정을 포함한 QueryClient 생성 헬퍼 함수
 *
 * @example
 * ```typescript
 * import { createQueryClientWithInterceptors } from 'next-type-fetch';
 *
 * const queryClient = createQueryClientWithInterceptors({
 *   baseURL: 'https://api.example.com',
 * }, (fetcher) => {
 *   // 인터셉터 설정
 *   fetcher.interceptors.request.use((config) => {
 *     config.headers = config.headers || {};
 *     config.headers['Authorization'] = `Bearer ${getToken()}`;
 *     return config;
 *   });
 * });
 * ```
 */
declare function createQueryClientWithInterceptors(options: QueryClientOptions, setupInterceptors: InterceptorSetupFunction): QueryClient;

/**
 * 기본 QueryObserver 옵션 (공통 속성)
 */
interface BaseQueryObserverOptions<T = any> {
    key: readonly unknown[];
    params?: Record<string, any>;
    schema?: ZodType;
    fetchConfig?: Omit<FetchConfig, "url" | "method" | "params" | "data">;
    enabled?: boolean;
    staleTime?: number;
    select?: (data: T) => any;
    placeholderData?: T | React.ReactNode | ((prevData: T | React.ReactNode | undefined, prevQuery?: QueryState<T> | undefined) => T | React.ReactNode);
    gcTime?: number;
}
/**
 * URL 기반 QueryObserver 옵션
 */
interface UrlBasedQueryObserverOptions<T = any> extends BaseQueryObserverOptions<T> {
    /**
     * API 요청 URL
     */
    url: string;
    /**
     * queryFn이 있으면 안됨 (상호 배제)
     */
    queryFn?: never;
}
/**
 * Custom Function 기반 QueryObserver 옵션
 */
interface FunctionBasedQueryObserverOptions<T = any> extends BaseQueryObserverOptions<T> {
    /**
     * Custom query function for complex requests
     * Options 방식에서는 fetcher만 받고, Factory 방식에서는 params와 fetcher를 받음
     */
    queryFn: ((fetcher: NextTypeFetch) => Promise<any>) | ((params: any, fetcher: NextTypeFetch) => Promise<any>);
    /**
     * url이 있으면 안됨 (상호 배제)
     */
    url?: never;
}
/**
 * QueryObserver 옵션
 * URL 방식 또는 Custom Function 방식 중 하나를 선택할 수 있음
 */
type QueryObserverOptions<T = any> = UrlBasedQueryObserverOptions<T> | FunctionBasedQueryObserverOptions<T>;
interface QueryObserverResult<T = unknown, E = unknown> {
    data?: T;
    error?: E;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    isSuccess: boolean;
    isStale: boolean;
    isPlaceholderData: boolean;
    refetch: () => void;
}

/**
 *  Observer 패턴 구현
 * placeholderData는 캐시와 완전히 분리하여 UI 레벨에서만 관리
 */
declare class QueryObserver<T = unknown, E = unknown> {
    private queryClient;
    private options;
    private listeners;
    private cacheKey;
    private isDestroyed;
    private currentResult;
    private optionsHash;
    private lastResultReference;
    private trackedResult;
    private placeholderManager;
    private resultComputer;
    private fetchManager;
    private optionsManager;
    constructor(queryClient: QueryClient, options: QueryObserverOptions<T>);
    private subscribeToCache;
    /**
     * invalidateQueries로 인한 무효화 감지 및 처리
     * updatedAt이 0이면 invalidateQueries로 인한 무효화로 간주
     */
    private handlePotentialInvalidation;
    /**
     * 결과 계산
     * 캐시 상태와 placeholderData를 완전히 분리하여 처리
     */
    private computeResult;
    /**
     * Tracked Properties 기반 결과 업데이트
     * 기본적으로 tracked 모드로 동작
     */
    private updateResult;
    /**
     * Structural Sharing 적용
     */
    private applyStructuralSharing;
    private hasChangeInTrackedProps;
    private isInitialState;
    private hasNoTrackedProperties;
    private hasTrackedPropertyChanged;
    private executeFetch;
    private fetchData;
    private notifyListeners;
    /**
     * 결과 구독 (React 컴포넌트에서 사용)
     */
    subscribe(listener: () => void): () => void;
    /**
     * Tracked Properties가 적용된 현재 결과 반환
     * TrackedResult 인스턴스를 재사용하여 속성 추적을 유지
     */
    getCurrentResult(): QueryObserverResult<T, E>;
    /**
     * 수동 refetch
     */
    refetch(): void;
    /**
     * 옵션 업데이트 최적화
     */
    setOptions(options: QueryObserverOptions<T>): void;
    private createCallbacks;
    private handleCachedDataAvailable;
    private handleNoCachedData;
    private scheduleNotifyListeners;
    /**
     * Observer 정리
     */
    destroy(): void;
}

/**
 * 쿼리 항목 타입
 */
type QueryItem = [QueryConfig<any, any>] | [QueryConfig<any, any>, any];
/**
 * SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.
 *
 * @example
 * ```typescript
 * // 파라미터가 없는 쿼리
 * await ssrPrefetch([
 *   [queries.users],
 *   [queries.posts, { userId: 1 }], // 파라미터가 있는 경우
 * ]);
 *
 * // 혼합 사용
 * await ssrPrefetch([
 *   [queries.users], // 파라미터 없음
 *   [queries.user, { userId: 1 }], // 파라미터 있음
 *   [queries.posts, { page: 1, limit: 10 }]
 * ]);
 * ```
 *
 * @param queries QueryItem[] 형태의 쿼리 배열
 * @param globalFetchConfig 모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)
 * @param client QueryClient 인스턴스 (선택사항, 제공하지 않으면 자동 생성)
 */
declare function ssrPrefetch(queries: Array<QueryItem>, globalFetchConfig?: Record<string, any>, client?: QueryClient): Promise<Record<string, any>>;

export { type AuthRetryOption, type CancelablePromise, ContentType, ErrorCode, type ErrorCodeType, type ErrorInterceptor, type ExtractMutationData, type ExtractMutationError, type ExtractMutationVariables, type ExtractParams, type FetchConfig, FetchError, type HttpMethod, type InterceptorHandle, type InterceptorSetupFunction, type Interceptors, type MutationConfig, type NextTypeFetch, type NextTypeResponse, type QueryCacheOptions, QueryClient, type QueryClientOptionsWithInterceptors, type QueryConfig, type QueryKey, QueryObserver, type QueryObserverOptions, type QueryObserverResult, type QueryState, type RequestConfig, type RequestInterceptor, type ResponseInterceptor, ResponseType, createError, createFetch, createMutationFactory, createQueryClientWithInterceptors, createQueryFactory, _default as defaultInstance, del, errorToResponse, get, getHeaders, getQueryClient, getStatus, handleFetchError, handleHttpError, hasErrorCode, hasStatus, head, interceptorTypes, interceptors, isFetchError, ntFetch, options, patch, post, put, request, resetQueryClient, setDefaultQueryClientOptions, ssrPrefetch, unwrap, validateMutationConfig, validateQueryConfig };
