import type { FetchConfig, NextTypeFetch } from "../types/index.js";
import { createInterceptors } from "../interceptors.js";
import { createRequestFunction } from "./request.js";
import { createHttpMethods } from "../methods/index.js";

/**
 * Next.js App Router와 함께 사용할 수 있는 타입 안전한 fetch 클라이언트를 생성합니다.
 * @param defaultConfig 기본 설정
 * @returns fetch 클라이언트 인스턴스
 */
export function createFetch(defaultConfig: FetchConfig = {}): NextTypeFetch {
	// 인터셉터 생성
	const interceptors = createInterceptors();

	// 요청 함수 생성
	const request = createRequestFunction(defaultConfig, interceptors);

	// HTTP 메서드 생성
	const methods = createHttpMethods(request, defaultConfig);

	// 클라이언트 인스턴스 생성
	const instance: NextTypeFetch = {
		defaults: { ...defaultConfig },
		interceptors: {
			request: {
				use: interceptors.request.use,
				eject: interceptors.request.eject,
			},
			response: {
				use: interceptors.response.use,
				eject: interceptors.response.eject,
			},
		},
		request,
		...methods,
	};

	return instance;
}
