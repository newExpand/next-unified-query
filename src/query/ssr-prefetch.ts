import type { QueryClient } from "./query-client";
import type { QueryConfig } from "./query-factory";
import { getQueryClient } from "./query-client-manager";
import { merge } from "es-toolkit/object";

/**
 * SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.
 * @param queries [QueryConfig, params][] 형태의 쿼리 배열
 * @param globalFetchConfig 모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)
 * @param client QueryClient 인스턴스 (선택사항, 제공하지 않으면 자동 생성)
 */
export async function ssrPrefetch(
  queries: Array<[QueryConfig<any, any>, any]>,
  globalFetchConfig: Record<string, any> = {},
  client?: QueryClient
): Promise<Record<string, any>> {
  // client가 제공되지 않으면 자동으로 생성 (서버 환경에서는 새 인스턴스)
  const queryClient = client || getQueryClient();

  const results = await Promise.allSettled(
    queries.map(async ([query, params]) => {
      try {
        const key = query.key(params);
        const url = query.url(params);
        const schema = query.schema;

        // 쿼리별 fetchConfig와 전역 fetchConfig 병합
        const fetchConfig = merge(
          {},
          merge(globalFetchConfig, query.fetchConfig || {})
        );

        const fetchFn = async () => {
          const fetcher = queryClient.getFetcher();
          const response = await fetcher.get(url, fetchConfig);
          let data = response.data;
          if (schema) {
            data = schema.parse(data);
          }
          if (query.select) {
            data = query.select(data);
          }
          return data;
        };

        await queryClient.prefetchQuery(key, fetchFn);
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
