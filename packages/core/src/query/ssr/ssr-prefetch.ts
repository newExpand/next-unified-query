import type { QueryClient } from "../client/query-client";
import type { QueryConfig } from "../factories/query-factory";
import { getQueryClient } from "../client/query-client-manager";
import { merge } from "es-toolkit/compat";

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
 * ```
 *
 * @param queries QueryItem[] 형태의 쿼리 배열
 * @param globalFetchConfig 모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)
 * @param client QueryClient 인스턴스 (선택사항, 제공하지 않으면 자동 생성)
 */
export async function ssrPrefetch(
  queries: Array<QueryItem>,
  globalFetchConfig: Record<string, any> = {},
  client?: QueryClient
): Promise<Record<string, any>> {
  // client가 제공되지 않으면 자동으로 생성 (서버 환경에서는 새 인스턴스)
  const queryClient = client || getQueryClient();

  const results = await Promise.allSettled(
    queries.map(async (queryItem) => {
      try {
        // query와 params 추출
        const [query, params] = queryItem;

        // 전역 fetchConfig를 쿼리 fetchConfig에 병합
        const mergedQuery = {
          ...query,
          fetchConfig: merge({}, globalFetchConfig, query.fetchConfig || {}),
        };

        // QueryClient의 오버로드된 prefetchQuery 사용
        await queryClient.prefetchQuery(mergedQuery, params);
      } catch (error) {
        console.error(`[ssrPrefetch] Failed to prefetch query:`, error);
        // 개별 쿼리 실패는 전체 prefetch를 중단하지 않음
      }
    })
  );

  // 실패한 쿼리들 로깅
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  if (failures.length > 0) {
    console.warn(`[ssrPrefetch] ${failures.length} queries failed to prefetch`);
  }

  // 캐시된 상태를 반환하여 HydrationBoundary에서 사용할 수 있도록 함
  return queryClient.dehydrate();
}
