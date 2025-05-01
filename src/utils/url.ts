/**
 * URL에 쿼리 파라미터를 추가합니다.
 * @param url 기본 URL
 * @param params 쿼리 파라미터 객체
 * @returns 쿼리 파라미터가 추가된 URL
 */
export function appendQueryParams(
	url: string,
	params?: Record<string, string | number | boolean | undefined | null>,
): string {
	if (!params) return url;

	const urlObj = new URL(url, "http://dummy-base.com");

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			urlObj.searchParams.append(key, String(value));
		}
	}

	// 'http://dummy-base.com' 제거
	return urlObj.href.replace("http://dummy-base.com", "");
}

/**
 * 베이스 URL과 상대 경로를 합칩니다.
 * @param baseURL 베이스 URL
 * @param url 상대 경로
 * @returns 완전한 URL
 */
export function combineURLs(baseURL?: string, url?: string): string {
	if (!baseURL) return url || "";
	if (!url) return baseURL;

	const baseEndsWithSlash = baseURL.endsWith("/");
	const urlStartsWithSlash = url.startsWith("/");

	if (baseEndsWithSlash && urlStartsWithSlash) {
		return baseURL + url.substring(1);
	}

	if (!baseEndsWithSlash && !urlStartsWithSlash) {
		return `${baseURL}/${url}`;
	}

	return baseURL + url;
}
