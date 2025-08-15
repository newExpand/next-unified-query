import type { QueryConfig } from "../factories/query-factory";
import { SSRQueryClient } from "./ssr-query-client";
import { serializeQueryKey } from "../cache/query-cache";
import type { QueryClientOptions } from "../client/query-client";
import { getQueryClient } from "../client/query-client-manager";

/**
 * 쿼리 항목 타입
 */
type QueryItem =
	| [QueryConfig<any, any>] // 파라미터가 없는 경우
	| [QueryConfig<any, any>, any]; // 파라미터가 있는 경우

/**
 * SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.
 *
 * @example
 * ```typescript
 * // 기본 사용법 (전역 설정 자동 사용)
 * await ssrPrefetch([
 *   [queries.users],
 *   [queries.posts, { userId: 1 }],
 * ]);
 *
 * // 설정과 함께 사용 (전역 설정 덮어쓰기)
 * await ssrPrefetch(
 *   [...queries],
 *   {
 *     baseURL: 'https://api.example.com',
 *     headers: { 'Authorization': 'Bearer token' }
 *   }
 * );
 * ```
 *
 * @param queries QueryItem[] 형태의 쿼리 배열
 * @param config QueryClient 설정 (선택사항, 제공되지 않으면 전역 설정 사용)
 */
export async function ssrPrefetch(
	queries: Array<QueryItem>,
	config?: QueryClientOptions,
): Promise<Record<string, any>> {
	// SSR 전용 경량 클라이언트 사용
	const queryClient = new SSRQueryClient();
	// 설정이 제공되지 않으면 전역 설정 사용, 제공되면 해당 설정 사용
	const client = getQueryClient(config);
	const fetcher = client.getFetcher();

	// 병렬로 모든 쿼리 실행
	await Promise.all(
		queries.map(async (queryItem) => {
			const [query, params] = queryItem;
			const cacheKey = query.cacheKey(params);
			const sKey = serializeQueryKey(cacheKey);

			try {
				let data: any;

				if (query.queryFn) {
					// Custom queryFn 사용
					data = await query.queryFn(params, fetcher);
				} else if (query.url) {
					// URL 기반 fetch
					const url = query.url(params);
					const response = await fetcher.get(url, Object.assign({}, query.fetchConfig, { params }));
					data = response.data;
				}

				// 스키마 검증
				if (query.schema && data) {
					data = query.schema.parse(data);
				}

				// select 함수 적용
				if (query.select && data) {
					data = query.select(data);
				}

				// 캐시에 저장
				queryClient.set(sKey, {
					data,
					error: undefined,
					isLoading: false,
					isFetching: false,
					updatedAt: Date.now(),
				});
			} catch (error) {
				// 에러 발생 시 캐시에 에러 상태 저장
				queryClient.set(sKey, {
					data: undefined,
					error,
					isLoading: false,
					isFetching: false,
					updatedAt: Date.now(),
				});
			}
		}),
	);

	// 최적화된 직렬화
	return queryClient.dehydrate();
}
