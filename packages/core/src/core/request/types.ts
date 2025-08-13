import type {
	NextTypeResponse,
	RequestConfig,
	FetchError,
	ApiErrorResponse,
} from "../../types";

/**
 * Request 모듈 내부에서 사용되는 타입 정의
 */

/**
 * 인터셉터 타입 정의
 */
export interface InterceptorsType {
	request: {
		run: (config: RequestConfig) => Promise<RequestConfig>;
	};
	response: {
		run: <T>(response: NextTypeResponse<T>) => Promise<NextTypeResponse<T>>;
	};
	error: {
		run: (error: FetchError<any>) => Promise<NextTypeResponse<unknown> | FetchError<any>>;
	};
}

/**
 * Retry 설정 타입
 */
export interface RetrySettings {
	maxRetries: number;
	retryStatusCodes: number[];
	retryBackoff: (retryCount: number) => number;
}