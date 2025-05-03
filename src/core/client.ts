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
  // 기본 설정에 throwOnHttpError 기본값 설정
  const mergedConfig: FetchConfig = {
    ...defaultConfig, // 사용자 제공 옵션이 기본값보다 우선 적용되도록 순서 변경
  };

  // 내부 설정으로 사용할 설정 (throwOnHttpError 기본값 포함)
  const internalConfig: FetchConfig = {
    ...mergedConfig,
    // 사용자가 명시적으로 설정하지 않았을 때만 기본값 적용
    throwOnHttpError:
      defaultConfig.throwOnHttpError !== undefined
        ? defaultConfig.throwOnHttpError
        : true,
  };

  // 인터셉터 생성
  const interceptors = createInterceptors();

  // 요청 함수 생성
  const request = createRequestFunction(internalConfig, interceptors);

  // HTTP 메서드 생성
  const methods = createHttpMethods(request, internalConfig);

  // 클라이언트 인스턴스 생성
  const instance: NextTypeFetch = {
    defaults: { ...mergedConfig },
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
