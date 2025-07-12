import type { FetchConfig, NextTypeFetch } from "../types";
import { createInterceptors } from "../interceptors";
import { createRequestFunction } from "./request";
import { createHttpMethods } from "../methods";
import { ErrorCode } from "../utils/error";

/**
 * Next.js App Router와 함께 사용할 수 있는 타입 안전한 fetch 클라이언트를 생성합니다.
 * @param defaultConfig 기본 설정
 * @returns fetch 클라이언트 인스턴스
 */
export function createFetch(defaultConfig: FetchConfig = {}): NextTypeFetch {
	// 사용자 설정 적용
	const mergedConfig: FetchConfig = {
		...defaultConfig,
	};

	// 인터셉터 생성
	const interceptors = createInterceptors();

	// 요청 함수 생성
	const request = createRequestFunction(mergedConfig, interceptors);

	// HTTP 메서드 생성
	const methods = createHttpMethods(request, mergedConfig);

	// 클라이언트 인스턴스 생성
	const instance: NextTypeFetch = {
		defaults: mergedConfig,
		interceptors,
		request,
		...methods,
	};

	return instance;
}

// 에러 코드 상수 노출
export { ErrorCode };
