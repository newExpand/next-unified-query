import { createFetch } from "./core/client";
import type { FetchConfig, NextTypeFetch } from "./types";

/**
 * 기본 fetch 인스턴스
 */
let defaultInstance = createFetch();

/**
 * 전역 인스턴스를 새로운 설정으로 업데이트합니다.
 * @internal 내부 사용을 위한 함수입니다.
 */
export function updateDefaultInstance(config: FetchConfig = {}): void {
	defaultInstance = createFetch(config);
}

/**
 * 기본 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const request: NextTypeFetch["request"] = (...args) => defaultInstance.request(...args);

/**
 * GET 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const get: NextTypeFetch["get"] = (...args) => defaultInstance.get(...args);

/**
 * POST 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const post: NextTypeFetch["post"] = (...args) => defaultInstance.post(...args);

/**
 * PUT 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const put: NextTypeFetch["put"] = (...args) => defaultInstance.put(...args);

/**
 * DELETE 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const del: NextTypeFetch["delete"] = (...args) => defaultInstance.delete(...args);

/**
 * PATCH 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const patch: NextTypeFetch["patch"] = (...args) => defaultInstance.patch(...args);

/**
 * HEAD 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const head: NextTypeFetch["head"] = (...args) => defaultInstance.head(...args);

/**
 * OPTIONS 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const options: NextTypeFetch["options"] = (...args) => defaultInstance.options(...args);

/**
 * 기본 설정 - 전역 설정 변경 가능
 * 라이브러리 이름(Next Type Fetch)의 약자를 사용한 고유명사
 */
export const ntFetch = new Proxy({} as FetchConfig, {
	get: (_, prop) => (defaultInstance.defaults as any)[prop],
	set: (_, prop, value) => {
		(defaultInstance.defaults as any)[prop] = value;
		return true;
	},
});

/**
 * 인터셉터 - 전역 인터셉터 설정 가능
 */
export const interceptors = new Proxy({} as NextTypeFetch["interceptors"], {
	get: (_, prop) => (defaultInstance.interceptors as any)[prop],
});

/**
 * 기본 인스턴스 - 모든 메서드 포함
 */
const defaultInstanceProxy = new Proxy({} as NextTypeFetch, {
	get: (_, prop) => (defaultInstance as any)[prop],
});

/**
 * 기본 fetch 인스턴스입니다.
 *
 * @internal 이 인스턴스는 내부 구현 세부사항입니다.
 * 대신 get, post, put 등의 전역 함수나 createFetch를 사용하세요.
 *
 * @example
 * ```tsx
 * // ❌ 권장하지 않음
 * import { defaultInstance } from 'next-unified-query';
 *
 * // ✅ 권장
 * import { get, post } from 'next-unified-query';
 * const response = await get('/api/data');
 * ```
 */
export default defaultInstanceProxy;
