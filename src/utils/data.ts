/**
 * 객체가 비어 있는지 확인합니다.
 * @param obj 객체
 * @returns 비어 있는지 여부
 */
export function isEmptyObject(obj?: Record<string, unknown>): boolean {
	return !obj || Object.keys(obj).length === 0;
}

/**
 * 객체를 JSON 문자열로 변환합니다.
 * @param data 객체
 * @returns JSON 문자열
 */
export function stringifyData(data: unknown): string | null {
	if (data === undefined || data === null) return null;
	if (typeof data === "string") return data;

	try {
		return JSON.stringify(data);
	} catch (e) {
		console.error("Failed to stringify data:", e);
		return null;
	}
}
