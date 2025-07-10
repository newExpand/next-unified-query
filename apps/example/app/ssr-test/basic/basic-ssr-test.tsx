"use client";

import { useQuery, createQueryFactory } from "../../lib/query-client";
import { useState } from "react";

const queries = createQueryFactory({
  users: {
    cacheKey: () => ["ssr-test", "users"] as const,
    url: () => "/api/ssr-test/users",
  },
  user: {
    cacheKey: (params: { id: string }) =>
      ["ssr-test", "user", params.id] as const,
    url: (params: { id: string }) => `/api/ssr-test/user/${params.id}`,
  },
  posts: {
    cacheKey: () => ["ssr-test", "posts"] as const,
    url: () => "/api/ssr-test/posts",
    select: (data: any[]) =>
      data.map((post) => ({ ...post, prefetched: true })),
    selectDeps: [],
  },
});

export function BasicSSRTest() {
  const [renderStartTime] = useState(() => Date.now());
  const { data: users, isLoading: usersLoading } = useQuery(queries.users, {});
  const { data: user, isLoading: userLoading } = useQuery(queries.user, {
    params: { id: "1" },
  });
  const { data: posts, isLoading: postsLoading } = useQuery(queries.posts, {});

  return (
    <div className="space-y-6">
      {/* 사용자 목록 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">사용자 목록 (파라미터 없는 쿼리)</h2>
        <div data-testid="users-section">
          {usersLoading ? (
            <div data-testid="users-loading">Loading...</div>
          ) : (
            <div data-testid="users-data">
              {users?.map((user: any) => (
                <div key={user.id} data-testid={`user-${user.id}`}>
                  {user.name} ({user.email})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 사용자 상세 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">사용자 상세 (파라미터 있는 쿼리)</h2>
        <div data-testid="user-section">
          {userLoading ? (
            <div data-testid="user-loading">Loading...</div>
          ) : (
            <div data-testid="user-data">
              <div data-testid="user-name">{user?.name}</div>
              <div data-testid="user-email">{user?.email}</div>
              <div data-testid="user-id">{user?.id}</div>
            </div>
          )}
        </div>
      </div>

      {/* 포스트 목록 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">포스트 목록 (select 함수 적용)</h2>
        <div data-testid="posts-section">
          {postsLoading ? (
            <div data-testid="posts-loading">Loading...</div>
          ) : (
            <div data-testid="posts-data">
              {posts?.map((post: any) => (
                <div key={post.id} data-testid={`post-${post.id}`}>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-sm text-gray-600">
                    Prefetched: {post.prefetched ? "Yes" : "No"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 디버그 정보 */}
      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">디버그 정보</h2>
        <div className="text-sm space-y-1">
          <div data-testid="debug-users-loading">
            Users Loading: {usersLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-user-loading">
            User Loading: {userLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-posts-loading">
            Posts Loading: {postsLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-timestamp">
            {new Date(renderStartTime).toISOString()}
          </div>
        </div>
      </div>
    </div>
  );
}
