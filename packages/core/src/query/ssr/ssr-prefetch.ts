import type { QueryConfig } from "../factories/query-factory";
import { SSRQueryClient } from "./ssr-query-client";
import { serializeQueryKey } from "../cache/query-cache";
import type { QueryClient } from "../client/query-client";
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
 * // 파라미터가 없는 쿼리
 * await ssrPrefetch([
 *   [queries.users],
 *   [queries.posts, { userId: 1 }], // 파라미터가 있는 경우
 * ]);
 *
 * // 혼합 사용
 * await ssrPrefetch([
 *   [queries.users], // 파라미터 없음
 *   [queries.user, { userId: 1 }], // 파라미터 있음
 *   [queries.posts, { page: 1, limit: 10 }]
 * ]);
 *
 * // QueryClient와 함께 사용 (인터셉터 적용)
 * const queryClient = new QueryClient();
 * await ssrPrefetch([
 *   [queries.user, { id: 1 }]
 * ], {}, queryClient);
 * ```
 *
 * @param queries QueryItem[] 형태의 쿼리 배열
 * @param globalFetchConfig 모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)
 * @param client 선택적 QueryClient 인스턴스 (인터셉터 등을 사용하려면 제공)
 */
export async function ssrPrefetch(
	queries: Array<QueryItem>,
	globalFetchConfig: Record<string, any> = {},
	client?: QueryClient,
): Promise<Record<string, any>> {
	// SSR 전용 경량 클라이언트 사용
	const queryClient = new SSRQueryClient();
	// QueryClient가 제공되면 해당 fetcher 사용, 아니면 defaultOptions가 적용된 QueryClient 생성
	const fetcher = client ? client.getFetcher() : getQueryClient(globalFetchConfig).getFetcher();

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
					const response = await fetcher.get(url, Object.assign({}, globalFetchConfig, query.fetchConfig, { params }));
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
