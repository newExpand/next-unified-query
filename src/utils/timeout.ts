/**
 * 타임아웃 프로미스를 생성합니다.
 * @param ms 타임아웃 시간 (ms)
 * @returns Promise와 AbortController
 */
export function createTimeoutPromise(ms?: number): { promise: Promise<never>; controller: AbortController } | null {
	if (!ms || ms <= 0) return null;

	const controller = new AbortController();

	const promise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			controller.abort();
			reject(new Error(`Request timeout of ${ms}ms exceeded`));
		}, ms);
	});

	return { promise, controller };
}
