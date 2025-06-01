import { addSSRPrefetch } from "./ssr-context";
import { QueryClient } from "./query-client";
import { serializeQueryKey } from "./query-cache";

// 사용 예시: await ssrPrefetch(queryConfig, params)
export async function ssrPrefetch(queryConfig: any, params: any) {
  const client = new QueryClient();
  const key = queryConfig.key(params);
  const url = queryConfig.url(params);
  // fetcher는 내부적으로 결합되어 있다고 가정
  await client.prefetchQuery(key, async () => {
    // 실제 fetcher 로직 (간단화)
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });
  // 쿼리 결과를 Context에 저장
  addSSRPrefetch(serializeQueryKey(key), client.get(key));
}
