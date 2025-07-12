import { isNil, isString } from "es-toolkit";

/**
 * 객체를 JSON 문자열로 변환합니다.
 * @param data 객체
 * @returns JSON 문자열
 */
export function stringifyData(data: unknown): string | null {
	if (isNil(data)) return null;
	if (isString(data)) return data;

	try {
		return JSON.stringify(data);
	} catch (e) {
		console.error("Failed to stringify data:", e);
		return null;
	}
}
