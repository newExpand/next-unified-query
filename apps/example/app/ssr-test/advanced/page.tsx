import {
  ssrPrefetch,
  HydrationBoundary,
  QueryClient,
  createQueryFactory,
  z,
} from "../../lib/query-client";
import { AdvancedSSRTest } from "./advanced-ssr-test";

// 스키마 정의
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  profile: z.object({
    bio: z.string(),
    avatar: z.string(),
  }),
});

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  tags: z.array(z.string()),
});

const queries = createQueryFactory({
  userWithSchema: {
    cacheKey: (params: { id: string }) =>
      ["ssr-test", "user-schema", params.id] as const,
    url: (params: { id: string }) => `/api/ssr-test/user-schema/${params.id}`,
    schema: UserSchema,
  },
  postsWithSchema: {
    cacheKey: () => ["ssr-test", "posts-schema"] as const,
    url: () => "/api/ssr-test/posts-schema",
    schema: z.array(PostSchema),
    select: (data: any[]) =>
      data.map((post) => ({
        ...post,
        processed: true,
        shortTitle: post.title.substring(0, 20) + "...",
      })),
    selectDeps: [],
  },
  customQuery: {
    cacheKey: () => ["ssr-test", "custom"] as const,
    queryFn: async (fetcher: any) => {
      // 복잡한 비즈니스 로직
      const [user, posts] = await Promise.all([
        fetcher.get("/api/ssr-test/user/1"),
        fetcher.get("/api/ssr-test/posts"),
      ]);

      return {
        user: user.data,
        posts: posts.data,
        combined: true,
        timestamp: Date.now(),
      };
    },
  },
});

export default async function SSRAdvancedTestPage() {
  // 인터셉터가 적용된 QueryClient 생성
  const queryClient = new QueryClient();

  // 인터셉터 설정
  queryClient.getFetcher().interceptors.request.use((config: any) => {
    config.headers = {
      ...config.headers,
      "X-SSR-Test": "true",
      "X-Timestamp": Date.now().toString(),
    };
    return config;
  });

  // 고급 SSR prefetch 테스트
  const dehydratedState = await ssrPrefetch(
    [
      [queries.userWithSchema, { id: "1" }], // 스키마 검증
      [queries.postsWithSchema], // 스키마 + select 함수
      [queries.customQuery], // 커스텀 queryFn
    ],
    {
      headers: { "X-SSR-Global": "true" },
    }
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">SSR 고급 테스트</h1>
      <div className="mb-4 p-4 bg-purple-50 rounded">
        <h2 className="font-semibold mb-2">테스트 목적</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 스키마 검증이 SSR에서 동작하는지 확인</li>
          <li>• select 함수와 스키마 조합 테스트</li>
          <li>• 커스텀 queryFn 테스트</li>
          <li>• 인터셉터가 SSR prefetch에 적용되는지 확인</li>
          <li>• 에러 처리 및 개별 쿼리 실패 테스트</li>
        </ul>
      </div>

      <HydrationBoundary state={dehydratedState}>
        <AdvancedSSRTest />
      </HydrationBoundary>
    </div>
  );
}
