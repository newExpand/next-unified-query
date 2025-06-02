import { addSSRPrefetch } from "./ssr-context";
import { QueryClient } from "./query-client";
import { serializeQueryKey } from "./query-cache";

// fetchOptions를 받아서 QueryClient에 전달
export async function ssrPrefetch(
  queryConfig: any,
  params: any,
  fetchOptions?: any
) {
  const client = new QueryClient(fetchOptions);
  const key = queryConfig.key(params);
  const url = queryConfig.url(params);
  const fetcher = client.getFetcher(); // createFetch 기반 fetcher

  await client.prefetchQuery(key, async () => {
    const response = await fetcher.get(url);
    return response.data;
  });

  addSSRPrefetch(serializeQueryKey(key), {
    [serializeQueryKey(key)]: client.get(key),
  });
}
