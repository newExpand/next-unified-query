import { ssrPrefetch } from "next-unified-query";
import { HydrationBoundary } from "../../../lib/query-client";
import UserProfile from "./user-profile";

// Server Component에서 데이터 prefetch
export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // SSR에서 사용자 데이터만 prefetch (포스트는 클라이언트에서 별도 로드)
  const dehydratedState = await ssrPrefetch([
    [
      {
        cacheKey: () => ["user", id],
        queryFn: async (params, fetcher) => {
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
      <UserProfile userId={id} />
    </HydrationBoundary>
  );
}
