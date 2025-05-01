import type { z } from "zod";

/**
 * 컨텐츠 타입 열거형
 */
export enum ContentType {
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
	HTML = "text/html",
}

/**
 * 응답 타입 열거형
 */
export enum ResponseType {
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
	RAW = "raw",
}

/**
 * HTTP 메서드 타입
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/**
 * 기본 설정 옵션 인터페이스
 */
export interface FetchConfig extends Omit<RequestInit, "signal" | "headers" | "body" | "method"> {
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
	 * 자동 재시도 횟수
	 */
	retry?: number;

	/**
	 * 응답을 JSON으로 파싱 여부
	 * @deprecated responseType을 사용하세요
	 */
	parseJSON?: boolean;

	/**
	 * 응답 데이터 검증을 위한 Zod 스키마
	 */
	schema?: z.ZodType<unknown>;

	/**
	 * Next.js fetch 옵션
	 * Next.js 15부터 도입된 옵션으로 revalidate 등을 설정할 수 있습니다.
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
}

/**
 * 특정 요청에 대한 설정 인터페이스
 */
export interface RequestConfig extends FetchConfig {
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
}

/**
 * 인터셉터 핸들러 타입
 */
export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
export type ResponseInterceptor<T = unknown> = (response: T) => Promise<T> | T;
export type ErrorInterceptor = (error: unknown) => Promise<unknown> | unknown;

/**
 * 인터셉터 인터페이스
 */
export interface Interceptors {
	request: {
		use: (interceptor: RequestInterceptor) => number;
		eject: (id: number) => void;
	};
	response: {
		use: (onFulfilled?: ResponseInterceptor, onRejected?: ErrorInterceptor) => number;
		eject: (id: number) => void;
	};
}

/**
 * Zod 스키마와 함께 사용하는 응답 타입
 */
export type ZodResponse<T> =
	| {
			data: T;
			error: null;
			status: number;
			headers: Headers;
	  }
	| {
			data: null;
			error: {
				message: string;
				status?: number;
				validation?: z.ZodError;
				raw?: unknown;
			};
			status?: number;
			headers?: Headers;
	  };

/**
 * 취소 가능한 요청 응답 타입
 */
export interface CancelableRequest<T> extends Promise<ZodResponse<T>> {
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
export interface NextTypeFetch {
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
	get: <T = unknown>(url: string, config?: FetchConfig) => CancelableRequest<T>;

	/**
	 * POST 요청
	 */
	post: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelableRequest<T>;

	/**
	 * PUT 요청
	 */
	put: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelableRequest<T>;

	/**
	 * DELETE 요청
	 */
	delete: <T = unknown>(url: string, config?: FetchConfig) => CancelableRequest<T>;

	/**
	 * PATCH 요청
	 */
	patch: <T = unknown>(url: string, data?: unknown, config?: FetchConfig) => CancelableRequest<T>;

	/**
	 * 기본 요청 메서드
	 */
	request: <T = unknown>(config: RequestConfig) => CancelableRequest<T>;
}
