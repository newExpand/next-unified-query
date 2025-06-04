import type { QueryClient } from "./query-client";
import type { QueryConfig } from "./query-factory";
import { merge } from "es-toolkit/object";

/**
 * SSR에서 여러 쿼리를 미리 패칭(prefetch)합니다.
 * @param client QueryClient 인스턴스
 * @param queries [QueryConfig, params][] 형태의 쿼리 배열
 * @param globalFetchConfig 모든 쿼리에 공통 적용할 fetchConfig (예: baseURL)
 */
export async function ssrPrefetch(
  client: QueryClient,
  queries: Array<[QueryConfig<any, any>, any]>,
  globalFetchConfig: Record<string, any> = {}
): Promise<void> {
  await Promise.all(
    queries.map(async ([query, params]) => {
      const key = query.key(params);
      const url = query.url(params);
      const schema = query.schema;
      // 쿼리별 fetchConfig와 전역 fetchConfig 병합
      const fetchConfig = merge(
        {},
        merge(globalFetchConfig, query.fetchConfig || {})
      );
      const fetchFn = async () => {
        const fetcher = client.getFetcher();
        const response = await fetcher.get(url, fetchConfig);
        let data = response.data;
        if (schema) {
          data = schema.parse(data);
        }
        return data;
      };
      await client.prefetchQuery(key, fetchFn);
    })
  );
}
