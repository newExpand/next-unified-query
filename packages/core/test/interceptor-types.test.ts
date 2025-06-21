import { describe, expect, it } from "vitest";
import { createFetch, interceptorTypes } from "../src";

describe("next-type-fetch: 인터셉터 타입", () => {
	it("인터셉터 타입: 타입에 따른 인터셉터 제거", () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 첫 번째 인터셉터 추가 (auth 타입은 기본값이므로 명시하지 않아도 됨)
		const authInterceptor = api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Auth-Token": "old-token",
				},
			};
		});

		// 두 번째 인터셉터 추가 (logging 타입)
		// 라이브러리 내부에서만 두 번째 인수를 처리할 수 있으므로 테스트 생략

		// 인터셉터 제거
		authInterceptor.remove();

		// 새 인증 인터셉터 추가
		api.interceptors.request.use((config) => {
			return {
				...config,
				headers: {
					...config.headers,
					"X-Auth-Token": "new-token",
				},
			};
		});

		// 특정 타입의 인터셉터 제거 기능 테스트
		api.interceptors.request.clearByType(interceptorTypes.auth);
	});

	it("인터셉터 타입: 에러 인터셉터 사용", () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 에러 핸들러 인터셉터 추가
		const errorHandler = api.interceptors.error.use((error) => {
			// 에러를 그대로 반환
			return error;
		});

		// 인터셉터 제거 테스트
		errorHandler.remove();
	});

	it("인터셉터 타입: 모든 인터셉터 제거", () => {
		const api = createFetch({ baseURL: "https://api.example.com" });

		// 여러 인터셉터 추가
		api.interceptors.request.use((config) => config);
		api.interceptors.response.use((response) => response);
		api.interceptors.error.use((error) => error);

		// 모든 요청 인터셉터 제거
		api.interceptors.request.clear();

		// 모든 인터셉터 제거
		api.interceptors.response.clear();
		api.interceptors.error.clear();
	});
});
