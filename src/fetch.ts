import { createFetch } from "./core/client.js";
import type { FetchConfig, NextTypeFetch } from "./types/index.js";

/**
 * 기본 fetch 인스턴스
 */
const defaultInstance = createFetch();

/**
 * 기본 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const request = defaultInstance.request;

/**
 * GET 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const get = defaultInstance.get;

/**
 * POST 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const post = defaultInstance.post;

/**
 * PUT 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const put = defaultInstance.put;

/**
 * DELETE 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const del = defaultInstance.delete;

/**
 * PATCH 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const patch = defaultInstance.patch;

/**
 * HEAD 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const head = defaultInstance.head;

/**
 * OPTIONS 요청 메서드 - 인스턴스 생성 없이 바로 사용 가능
 */
export const options = defaultInstance.options;

/**
 * 기본 설정 - 전역 설정 변경 가능
 * 라이브러리 이름(Next Type Fetch)의 약자를 사용한 고유명사
 */
export const ntFetch: FetchConfig = defaultInstance.defaults;

/**
 * 인터셉터 - 전역 인터셉터 설정 가능
 */
export const interceptors = defaultInstance.interceptors;

/**
 * 기본 인스턴스 - 모든 메서드 포함
 */
export default defaultInstance as NextTypeFetch;
