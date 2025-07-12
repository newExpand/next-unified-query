import { isEqual, isPlainObject, keys, isArray } from "es-toolkit/compat";

/**
 * Structural Sharing 구현
 * es-toolkit/compat 함수들을 사용한 참조 안정성 최적화
 *
 * @description
 * 이 함수는 두 값을 비교하여 값이 동일한 경우 이전 참조를 유지하는
 * "Structural Sharing" 최적화를 수행합니다. 이를 통해 React의 렌더링 최적화와
 * 메모이제이션 효과를 얻을 수 있습니다.
 *
 * @param prev - 이전 값
 * @param next - 새로운 값
 * @returns 최적화된 값 (가능한 경우 이전 참조 유지)
 *
 * @example
 * ```typescript
 * const prev = { user: { id: 1, name: 'John' } };
 * const next = { user: { id: 1, name: 'John' } };
 * const result = replaceEqualDeep(prev, next);
 * console.log(result === prev); // true (참조가 유지됨)
 * ```
 */
export function replaceEqualDeep<T>(prev: T, next: T): T {
	// 1. 참조 동일성 체크 (가장 빠른 경로)
	if (prev === next) {
		return prev;
	}

	// 2. primitive 타입 최적화 (빠른 반환)
	const prevType = typeof prev;
	const nextType = typeof next;

	if (prevType !== nextType) {
		return next;
	}

	// primitive 타입은 === 비교로 충분
	if (prevType !== "object" || prev === null || next === null) {
		return next;
	}

	// 3. 배열 처리 (타입 체크 최적화)
	const prevIsArray = Array.isArray(prev);
	const nextIsArray = Array.isArray(next);

	if (prevIsArray !== nextIsArray) {
		return next;
	}

	if (prevIsArray && nextIsArray) {
		if (prev.length !== next.length) {
			return next;
		}

		let hasChanged = false;
		const result = prev.map((item, index) => {
			const nextItem = replaceEqualDeep(item, next[index]);
			if (nextItem !== item) {
				hasChanged = true;
			}
			return nextItem;
		});

		return hasChanged ? (result as T) : prev;
	}

	// 4. 순수 객체 처리 (최적화된 키 비교)
	if (isPlainObject(prev) && isPlainObject(next)) {
		const prevObj = prev as Record<string, unknown>;
		const nextObj = next as Record<string, unknown>;
		const prevKeys = Object.keys(prevObj);
		const nextKeys = Object.keys(nextObj);

		// 키 개수가 다르면 새 객체 반환
		if (prevKeys.length !== nextKeys.length) {
			return next;
		}

		let hasChanged = false;
		const result: Record<string, unknown> = {};

		// 빠른 키 존재 확인
		for (const key of nextKeys) {
			if (!(key in prevObj)) {
				return next;
			}
		}

		// 값 비교 및 최적화
		for (const key of nextKeys) {
			const prevValue = prevObj[key];
			const nextValue = nextObj[key];

			// 참조가 같으면 재귀 호출 생략
			if (prevValue === nextValue) {
				result[key] = prevValue;
			} else {
				const optimizedValue = replaceEqualDeep(prevValue, nextValue);
				if (optimizedValue !== prevValue) {
					hasChanged = true;
				}
				result[key] = optimizedValue;
			}
		}

		return hasChanged ? (result as T) : prev;
	}

	// 5. 깊은 비교 (마지막 수단)
	if (isEqual(prev, next)) {
		return prev;
	}

	// 6. 객체가 아닌 경우 또는 다른 타입의 객체인 경우
	return next;
}
