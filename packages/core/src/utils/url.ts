import { isEmpty } from "es-toolkit/compat";
import { compact, trim, isNil, pickBy } from "es-toolkit";

/**
 * URL에 쿼리 파라미터를 추가합니다.
 * 순수한 문자열 처리로 구현하여 안전하고 예측 가능합니다.
 * @param url 기본 URL (절대 URL 또는 상대 경로)
 * @param params 쿼리 파라미터 객체
 * @returns 쿼리 파라미터가 추가된 URL
 */
export function appendQueryParams(
  url: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  // URL 정리 및 빈 파라미터 체크
  const cleanUrl = trim(url);
  if (!params || isEmpty(params)) return cleanUrl;

  // 유효한 파라미터만 필터링
  const validParams = pickBy(params, (value) => !isNil(value));

  if (isEmpty(validParams)) return cleanUrl;

  // URL을 파트별로 분리 (fragment 먼저 분리)
  const [baseUrl, fragment] = cleanUrl.split("#");
  const [path, existingQuery] = baseUrl.split("?");

  // 기존 쿼리 파라미터 파싱
  const existingParams = new URLSearchParams(existingQuery || "");

  // 새 파라미터 추가 (덮어쓰기 방식으로 중복 방지)
  Object.entries(validParams).forEach(([key, value]) => {
    existingParams.set(key, String(value));
  });

  // URL 파트들을 배열로 구성하고 compact로 빈 값 제거
  const queryString = existingParams.toString();
  const urlParts = compact([
    path,
    queryString ? `?${queryString}` : null,
    fragment ? `#${fragment}` : null,
  ]);

  return urlParts.join("");
}

/**
 * 베이스 URL과 상대 경로를 합칩니다.
 * @param baseURL 베이스 URL
 * @param url 상대 경로
 * @returns 완전한 URL
 */
export function combineURLs(baseURL?: string, url?: string): string {
  // 입력값 정리
  const cleanBaseURL = baseURL ? trim(baseURL) : "";
  const cleanUrl = url ? trim(url) : "";

  if (!cleanBaseURL) return cleanUrl;
  if (!cleanUrl) return cleanBaseURL;

  const baseEndsWithSlash = cleanBaseURL.endsWith("/");
  const urlStartsWithSlash = cleanUrl.startsWith("/");

  if (baseEndsWithSlash && urlStartsWithSlash) {
    return cleanBaseURL + cleanUrl.substring(1);
  }

  if (!baseEndsWithSlash && !urlStartsWithSlash) {
    return `${cleanBaseURL}/${cleanUrl}`;
  }

  return cleanBaseURL + cleanUrl;
}
