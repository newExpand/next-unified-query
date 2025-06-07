import { QueryClient, ssrPrefetch } from "next-type-fetch";

import { postQueries } from "../factory";
import { PostListView } from "./post-list-view";
import { NextTypeFetchHydrationBoundary } from "../hydration-boundary";

export default async function PostList() {
  const queryClient = new QueryClient({
    baseURL: "http://localhost:3001",
  });
  // posts 쿼리 prefetch
  await ssrPrefetch(queryClient, [
    [postQueries.list, { params: { userId: 1 } }],
  ]);
  const state = queryClient.dehydrate();

  return (
    <NextTypeFetchHydrationBoundary state={state}>
      <PostListView userId={1} />
    </NextTypeFetchHydrationBoundary>
  );
}
