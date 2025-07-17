"use client";

import { FetchError } from "next-unified-query";
import { useQuery } from "../../../lib/query-client";

interface User {
  id: string;
  name: string;
  timestamp: number;
  testHeader: string | null;
  customHeader: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  // 사용자 정보 쿼리 (성공해야 함)
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery<User, FetchError>({
    cacheKey: ["user", userId],
    url: `/api/user/${userId}`,
    staleTime: 300000, // 5분
    gcTime: 600000, // 10분
  });

  // 사용자 포스트 쿼리 (실패 시나리오 테스트용)
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery<Post[], FetchError>({
    cacheKey: ["user", userId, "posts"],
    url: `/api/user/${userId}/posts`,
    staleTime: 300000, // 5분
    gcTime: 600000, // 10분
  });

  return (
    <div className="container mx-auto p-8" data-testid="user-detail">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      <div className="space-y-6">
        {/* 사용자 정보 섹션 */}
        <div className="border p-6 rounded-lg" data-testid="user-profile">
          <h2 className="font-semibold mb-4">User Information</h2>

          {userError ? (
            <div className="space-y-4">
              <div data-testid="user-error" className="text-red-600">
                Error loading user: {userError.message}
              </div>
              <button
                data-testid="user-retry-btn"
                onClick={() => refetchUser()}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Retry User Data
              </button>
            </div>
          ) : userLoading ? (
            <div data-testid="user-loading">Loading user information...</div>
          ) : user ? (
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p data-testid="user-name">
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(user.timestamp).toLocaleString()}
              </p>
              {user.testHeader && (
                <p>
                  <strong>Test Header:</strong> {user.testHeader}
                </p>
              )}
            </div>
          ) : (
            <p>No user data available</p>
          )}
        </div>

        {/* 포스트 섹션 */}
        <div className="border p-6 rounded-lg">
          <h2 className="font-semibold mb-4">User Posts</h2>

          {postsError ? (
            <div className="space-y-4">
              <div data-testid="posts-error" className="text-red-600">
                Error loading posts: {postsError.message}
              </div>
              <button
                data-testid="posts-retry-btn"
                onClick={() => refetchPosts()}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Retry Posts
              </button>
            </div>
          ) : postsLoading ? (
            <div data-testid="posts-loading">Loading posts...</div>
          ) : posts && posts.length > 0 ? (
            <div data-testid="posts-list" className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  data-testid={`post-item-${post.id}`}
                  className="border p-4 rounded bg-gray-50"
                >
                  <h3 className="font-medium text-lg">{post.title}</h3>
                  <p className="text-gray-600 mt-2">{post.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p data-testid="posts-empty">No posts available</p>
          )}
        </div>

        {/* 기타 섹션들 (정상 동작 확인용) */}
        <div className="border p-6 rounded-lg bg-green-50">
          <h2 className="font-semibold mb-4">Additional Information</h2>
          <div className="space-y-2">
            <p>
              <strong>Profile Status:</strong>{" "}
              {userError
                ? "❌ Failed"
                : userLoading
                ? "⏳ Loading"
                : "✅ Loaded"}
            </p>
            <p>
              <strong>Posts Status:</strong>{" "}
              {postsError
                ? "❌ Failed"
                : postsLoading
                ? "⏳ Loading"
                : "✅ Loaded"}
            </p>
            <p>
              <strong>Page Type:</strong> Profile with partial data loading
            </p>
          </div>
        </div>

        {/* 디버그 정보 */}
        <div className="border p-4 rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>
              <strong>User Loading:</strong> {userLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Posts Loading:</strong> {postsLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>User Error:</strong>{" "}
              {userError ? userError.message : "None"}
            </p>
            <p>
              <strong>Posts Error:</strong>{" "}
              {postsError ? postsError.message : "None"}
            </p>
            <p>
              <strong>Posts Count:</strong> {posts ? posts.length : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
