import type { FetchConfig, RequestConfig } from "../types";

/**
 * 요청 설정을 병합합니다.
 * @param defaultConfig 기본 설정
 * @param requestConfig 요청별 설정
 * @returns 병합된 설정
 */
export function mergeConfigs(
  defaultConfig: FetchConfig = {},
  requestConfig: RequestConfig = {}
): RequestConfig {
  // RequestConfig 타입으로 캐스팅
  const mergedConfig = {
    ...defaultConfig,
    ...requestConfig,
  } as RequestConfig;

  // 헤더 병합
  mergedConfig.headers = {
    ...defaultConfig.headers,
    ...requestConfig.headers,
  };

  // 쿼리 파라미터 병합
  mergedConfig.params = {
    ...defaultConfig.params,
    ...requestConfig.params,
  };

  // next 옵션 병합
  if (defaultConfig.next || requestConfig.next) {
    mergedConfig.next = {
      ...defaultConfig.next,
      ...requestConfig.next,
    };
  }

  return mergedConfig;
}
