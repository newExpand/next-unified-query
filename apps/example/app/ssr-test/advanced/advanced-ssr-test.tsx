"use client";

import { useQuery, createQueryFactory, z } from "../../lib/query-client";

// 스키마 정의 (서버와 동일)
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
  errorQuery: {
    cacheKey: () => ["ssr-test", "error"] as const,
    url: () => "/api/ssr-test/error",
  },
});

export function AdvancedSSRTest() {
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery(queries.userWithSchema, { params: { id: "1" } });

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery(queries.postsWithSchema, {});

  const {
    data: custom,
    isLoading: customLoading,
    error: customError,
  } = useQuery<any>(queries.customQuery, {});

  const {
    data: errorData,
    isLoading: errorLoading,
    error: errorError,
  } = useQuery(queries.errorQuery, {});

  return (
    <div className="space-y-6">
      {/* 스키마 검증 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">스키마 검증 테스트</h2>
        <div data-testid="user-schema-section">
          {userLoading ? (
            <div data-testid="user-schema-loading">Loading...</div>
          ) : userError ? (
            <div data-testid="user-schema-error" className="text-red-600">
              Error: {userError.message}
            </div>
          ) : (
            <div data-testid="user-schema-data">
              <div data-testid="user-schema-name">{user?.name}</div>
              <div data-testid="user-schema-email">{user?.email}</div>
              <div data-testid="user-schema-bio">{user?.profile.bio}</div>
              <div data-testid="user-schema-avatar">{user?.profile.avatar}</div>
            </div>
          )}
        </div>
      </div>

      {/* 스키마 + select 함수 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">스키마 + Select 함수 테스트</h2>
        <div data-testid="posts-schema-section">
          {postsLoading ? (
            <div data-testid="posts-schema-loading">Loading...</div>
          ) : postsError ? (
            <div data-testid="posts-schema-error" className="text-red-600">
              Error: {postsError.message}
            </div>
          ) : (
            <div data-testid="posts-schema-data">
              {posts?.map((post: any) => (
                <div
                  key={post.id}
                  data-testid={`post-schema-${post.id}`}
                  className="mb-2"
                >
                  <div className="font-medium">{post.shortTitle}</div>
                  <div className="text-sm text-gray-600">
                    Processed: {post.processed ? "Yes" : "No"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Tags: {post.tags.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 커스텀 queryFn 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">커스텀 QueryFn 테스트</h2>
        <div data-testid="custom-query-section">
          {customLoading ? (
            <div data-testid="custom-query-loading">Loading...</div>
          ) : customError ? (
            <div data-testid="custom-query-error" className="text-red-600">
              Error: {customError.message}
            </div>
          ) : (
            <div data-testid="custom-query-data">
              <div data-testid="custom-combined">
                Combined: {custom?.combined ? "Yes" : "No"}
              </div>
              <div data-testid="custom-timestamp">
                Timestamp: {custom?.timestamp}
              </div>
              <div data-testid="custom-user-name">
                User Name: {custom?.user?.name}
              </div>
              <div data-testid="custom-posts-count">
                Posts Count: {custom?.posts?.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에러 처리 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">에러 처리 테스트</h2>
        <div data-testid="error-query-section">
          {errorLoading ? (
            <div data-testid="error-query-loading">Loading...</div>
          ) : errorError ? (
            <div data-testid="error-query-error" className="text-red-600">
              Expected Error: {errorError.message}
            </div>
          ) : (
            <div data-testid="error-query-data">
              Unexpected success: {JSON.stringify(errorData)}
            </div>
          )}
        </div>
      </div>

      {/* 디버그 정보 */}
      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">디버그 정보</h2>
        <div className="text-sm space-y-1">
          <div data-testid="debug-user-schema-loading">
            User Schema Loading: {userLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-posts-schema-loading">
            Posts Schema Loading: {postsLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-custom-loading">
            Custom Query Loading: {customLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-error-loading">
            Error Query Loading: {errorLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-rendered-at">Component Loaded: Yes</div>
        </div>
      </div>
    </div>
  );
}
