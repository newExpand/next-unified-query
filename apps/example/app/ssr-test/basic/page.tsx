import { ssrPrefetch, HydrationBoundary, createQueryFactory } from "../../lib/query-client";
import { BasicSSRTest } from "./basic-ssr-test";

const queries = createQueryFactory({
  users: {
    cacheKey: () => ["ssr-test", "users"] as const,
    url: () => "/api/ssr-test/users",
  },
  user: {
    cacheKey: (params: { id: string }) => ["ssr-test", "user", params.id] as const,
    url: (params: { id: string }) => `/api/ssr-test/user/${params.id}`,
  },
  posts: {
    cacheKey: () => ["ssr-test", "posts"] as const,
    url: () => "/api/ssr-test/posts",
    select: (data: any[]) => data.map((post) => ({ ...post, prefetched: true })),
    selectDeps: [],
  },
});

export default async function SSRBasicTestPage() {
  // 기본 SSR prefetch 테스트
  const dehydratedState = await ssrPrefetch([
    [queries.users], // 파라미터 없는 쿼리
    [queries.user, { id: "1" }], // 파라미터 있는 쿼리
    [queries.posts], // select 함수가 있는 쿼리
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">SSR 기본 테스트</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">테스트 목적</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• SSR에서 다중 쿼리 prefetch 동작 확인</li>
          <li>• 파라미터 있는/없는 쿼리 처리</li>
          <li>• select 함수 SSR 적용 확인</li>
          <li>• HydrationBoundary 데이터 전달 확인</li>
        </ul>
      </div>

      <HydrationBoundary state={dehydratedState}>
        <BasicSSRTest />
      </HydrationBoundary>
    </div>
  );
}