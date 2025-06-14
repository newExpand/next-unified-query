import { ssrPrefetch } from "next-type-fetch";

import { postQueries } from "../post-factory";
import { PostListView } from "./post-list-view";
import { HydrationBoundary } from "next-type-fetch/react";

export default async function PostList() {
  const state = await ssrPrefetch([[postQueries.list, { userId: 1 }]]);

  return (
    <HydrationBoundary state={state}>
      <PostListView userId={1} />
    </HydrationBoundary>
  );
}
