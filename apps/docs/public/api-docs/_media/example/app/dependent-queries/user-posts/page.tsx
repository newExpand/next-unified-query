"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  createdAt: string;
}

export default function UserPostsDependentQueries() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 1단계: 사용자 목록 조회
  const { 
    data: users, 
    isLoading: usersLoading,
    error: usersError 
  } = useQuery<User[], FetchError>({
    cacheKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json() as Promise<User[]>;
    },
  });

  // 2단계: 선택된 사용자 정보 조회 (사용자가 선택된 경우에만)
  const { 
    data: selectedUser, 
    isLoading: userLoading,
    error: userError 
  } = useQuery<User, FetchError>({
    cacheKey: ["user", selectedUserId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${selectedUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json() as Promise<User>;
    },
    enabled: !!selectedUserId, // selectedUserId가 있을 때만 실행
  });

  // 3단계: 선택된 사용자의 게시물 조회 (사용자 정보가 로드된 후에만)
  const { 
    data: userPosts, 
    isLoading: postsLoading,
    error: postsError 
  } = useQuery<Post[], FetchError>({
    cacheKey: ["posts", "user", selectedUserId],
    queryFn: async () => {
      const response = await fetch(`/api/posts?userId=${selectedUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user posts");
      }
      return response.json() as Promise<Post[]>;
    },
    enabled: !!selectedUser && !!selectedUserId, // 사용자 정보가 로드되고 ID가 있을 때만 실행
  });

  // 4단계: 게시물 상세 정보 (첫 번째 게시물이 있을 때만)
  const firstPostId = userPosts?.[0]?.id;
  const { 
    data: firstPostDetails, 
    isLoading: firstPostLoading 
  } = useQuery<Post & { comments: any[] }, FetchError>({
    cacheKey: ["post", "details", firstPostId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${firstPostId}/details`);
      if (!response.ok) {
        throw new Error("Failed to fetch post details");
      }
      return response.json();
    },
    enabled: !!firstPostId, // 첫 번째 게시물 ID가 있을 때만 실행
  });

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    
    // E2E 테스트를 위한 전역 상태 저장
    (window as any).__DEPENDENT_QUERY_STATE__ = {
      selectedUserId: userId,
      step: "user-selected",
      timestamp: Date.now(),
    };
  };

  const resetSelection = () => {
    setSelectedUserId(null);
    (window as any).__DEPENDENT_QUERY_STATE__ = {
      selectedUserId: null,
      step: "reset",
      timestamp: Date.now(),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            의존성 쿼리 테스트: 사용자 → 게시물
          </h1>

          {/* 쿼리 실행 상태 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">쿼리 실행 단계</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  usersLoading ? "bg-blue-500 text-white" : 
                  users ? "bg-green-500 text-white" : "bg-gray-300"
                }`}>
                  1
                </div>
                <p className="font-medium">사용자 목록</p>
                <p className="text-gray-600">
                  {usersLoading ? "로딩 중" : users ? "완료" : "대기"}
                </p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  userLoading ? "bg-blue-500 text-white" : 
                  selectedUser ? "bg-green-500 text-white" : "bg-gray-300"
                }`}>
                  2
                </div>
                <p className="font-medium">사용자 정보</p>
                <p className="text-gray-600">
                  {userLoading ? "로딩 중" : selectedUser ? "완료" : "대기"}
                </p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  postsLoading ? "bg-blue-500 text-white" : 
                  userPosts ? "bg-green-500 text-white" : "bg-gray-300"
                }`}>
                  3
                </div>
                <p className="font-medium">사용자 게시물</p>
                <p className="text-gray-600">
                  {postsLoading ? "로딩 중" : userPosts ? "완료" : "대기"}
                </p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  firstPostLoading ? "bg-blue-500 text-white" : 
                  firstPostDetails ? "bg-green-500 text-white" : "bg-gray-300"
                }`}>
                  4
                </div>
                <p className="font-medium">게시물 상세</p>
                <p className="text-gray-600">
                  {firstPostLoading ? "로딩 중" : firstPostDetails ? "완료" : "대기"}
                </p>
              </div>
            </div>
          </div>

          {/* 1단계: 사용자 목록 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">1단계: 사용자 선택</h2>
              <button
                onClick={resetSelection}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                data-testid="reset-selection-btn"
              >
                선택 초기화
              </button>
            </div>
            
            {usersLoading && (
              <div className="text-center py-4" data-testid="users-loading">
                <p>사용자 목록을 불러오는 중...</p>
              </div>
            )}
            
            {usersError && (
              <div className="text-center py-4 text-red-600">
                <p>사용자 목록을 불러오는데 실패했습니다.</p>
              </div>
            )}
            
            {users && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="users-list">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className={`p-4 rounded border text-left transition-colors ${
                      selectedUserId === user.id
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    data-testid={`user-${user.id}`}
                  >
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2단계: 선택된 사용자 정보 */}
          {selectedUserId && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2단계: 사용자 정보</h2>
              
              {userLoading && (
                <div className="text-center py-4">
                  <p>사용자 정보를 불러오는 중...</p>
                </div>
              )}
              
              {userError && (
                <div className="text-center py-4 text-red-600">
                  <p>사용자 정보를 불러오는데 실패했습니다.</p>
                </div>
              )}
              
              {selectedUser && (
                <div className="bg-gray-50 p-4 rounded" data-testid="selected-user-info">
                  <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500 mt-2">ID: {selectedUser.id}</p>
                </div>
              )}
            </div>
          )}

          {/* 3단계: 사용자 게시물 */}
          {selectedUser && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3단계: 사용자 게시물</h2>
              
              {postsLoading && (
                <div className="text-center py-4">
                  <p>게시물을 불러오는 중...</p>
                </div>
              )}
              
              {postsError && (
                <div className="text-center py-4 text-red-600">
                  <p>게시물을 불러오는데 실패했습니다.</p>
                </div>
              )}
              
              {userPosts && userPosts.length > 0 && (
                <div className="space-y-4" data-testid="user-posts">
                  {userPosts.map((post) => (
                    <div key={post.id} className="bg-white border rounded p-4">
                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                      <p className="text-gray-600 mt-1">{post.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        작성일: {new Date(post.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {userPosts && userPosts.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>작성된 게시물이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 4단계: 첫 번째 게시물 상세 */}
          {firstPostId && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">4단계: 첫 번째 게시물 상세</h2>
              
              {firstPostLoading && (
                <div className="text-center py-4">
                  <p>게시물 상세 정보를 불러오는 중...</p>
                </div>
              )}
              
              {firstPostDetails && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4" data-testid="first-post-details">
                  <h4 className="font-medium text-gray-900">{firstPostDetails.title}</h4>
                  <p className="text-gray-600 mt-2">{firstPostDetails.content}</p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      댓글 수: {firstPostDetails.comments?.length || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 의존성 설명 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3">의존성 쿼리 동작</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>• <strong>1단계</strong>: 사용자 목록 조회 (즉시 실행)</p>
              <p>• <strong>2단계</strong>: 사용자 선택 시 해당 사용자 정보 조회</p>
              <p>• <strong>3단계</strong>: 사용자 정보 로드 완료 후 해당 사용자의 게시물 조회</p>
              <p>• <strong>4단계</strong>: 게시물 목록 로드 완료 후 첫 번째 게시물 상세 조회</p>
              <p>• 각 단계는 이전 단계의 완료를 기다리며, <code>enabled</code> 옵션으로 제어됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}