import type { QueryState } from "../cache/query-cache";
import { serializeQueryKey } from "../cache/query-cache";

/**
 * SSR 전용 경량 QueryClient
 *
 * @description
 * 서버 사이드 렌더링에 최적화된 경량 QueryClient입니다.
 * 불필요한 기능을 제거하고 성능에 집중했습니다:
 * - 구독 시스템 제거
 * - 가비지 컬렉션 제거
 * - LRU 캐시 대신 간단한 Map 사용
 * - 최소한의 메서드만 구현
 */
export class SSRQueryClient {
	private cache = new Map<string, QueryState>();

	/**
	 * 캐시에 데이터 저장
	 */
	set(key: string | readonly unknown[], state: QueryState): void {
		const sKey = serializeQueryKey(key);
		this.cache.set(sKey, state);
	}

	/**
	 * 캐시에서 데이터 조회
	 */
	get<T = any>(key: string | readonly unknown[]): QueryState<T> | undefined {
		return this.cache.get(serializeQueryKey(key)) as QueryState<T> | undefined;
	}

	/**
	 * 캐시 존재 여부 확인
	 */
	has(key: string | readonly unknown[]): boolean {
		return this.cache.has(serializeQueryKey(key));
	}

	/**
	 * 캐시 직렬화 (hydration용)
	 * 최적화: 필요한 데이터만 포함
	 */
	dehydrate(): Record<string, QueryState> {
		const result: Record<string, QueryState> = {};

		this.cache.forEach((state, key) => {
			// 에러가 있거나 데이터가 없는 경우 제외
			if (!state.error && state.data !== undefined) {
				result[key] = {
					data: state.data,
					error: undefined,
					isLoading: false,
					isFetching: false,
					updatedAt: state.updatedAt,
				};
			}
		});

		return result;
	}

	/**
	 * 캐시 크기 반환 (디버깅용)
	 */
	get size(): number {
		return this.cache.size;
	}
}
