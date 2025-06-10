import { ssrPrefetch } from "next-type-fetch";

import { postQueries } from "../factory";
import { PostListView } from "./post-list-view";
import { NextTypeFetchHydrationBoundary } from "../hydration-boundary";
import { queryClient } from "../lib/api";

export default async function PostList() {
  // posts 쿼리 prefetch
  await ssrPrefetch(queryClient, [[postQueries.list, { userId: 1 }]]);
  const state = queryClient.dehydrate();

  return (
    <NextTypeFetchHydrationBoundary state={state}>
      <PostListView userId={1} />
    </NextTypeFetchHydrationBoundary>
  );
}
