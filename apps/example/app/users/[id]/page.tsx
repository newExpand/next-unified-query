import { ssrPrefetch } from "next-unified-query";
import { HydrationBoundary } from "../../lib/query-client";
import UserDetail from "./user-detail";

// Server Component에서 데이터 prefetch
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // SSR에서 사용자 데이터 prefetch
  const dehydratedState = await ssrPrefetch([
    [
      {
        cacheKey: () => ["user", id],
        queryFn: async (_params, fetcher) => {
          const response = await fetcher.get(`/api/user/${id}`);
          if (!response.data) {
            throw new Error("Failed to fetch user");
          }
          return response.data;
        },
      },
    ],
  ]);

  return (
    <HydrationBoundary state={dehydratedState}>
      <UserDetail userId={id} />
    </HydrationBoundary>
  );
}
