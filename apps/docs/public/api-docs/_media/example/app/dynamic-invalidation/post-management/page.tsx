"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

interface Post {
  id: number;
  title: string;
  category: string;
}

export default function PostManagementPage() {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("tech");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 전체 게시물 목록
  const {
    data: allPosts,
    isLoading: allPostsLoading,
  } = useQuery({
    cacheKey: ["posts"],
    url: "/api/posts",
  });

  // 기술 카테고리 게시물
  const {
    data: techPosts,
    isLoading: techPostsLoading,
  } = useQuery({
    cacheKey: ["posts", { category: "tech" }],
    url: "/api/posts?category=tech",
    enabled: selectedFilter === "tech",
  });

  // 라이프 카테고리 게시물
  const {
    data: lifePosts,
    isLoading: lifePostsLoading,
  } = useQuery({
    cacheKey: ["posts", { category: "life" }],
    url: "/api/posts?category=life",
    enabled: selectedFilter === "life",
  });

  // 새 게시물 생성 mutation
  const createPostMutation = useMutation({
    url: "/api/posts",
    method: "POST",
    onSuccess: (data, _variables) => {
      // 동적 무효화: 생성된 게시물의 카테고리에 따라 관련 쿼리만 무효화
      const createdPost = data as Post;
      const category = createdPost.category;

      // 전체 목록은 항상 무효화
      queryClient.invalidateQueries(["posts"]);
      
      // 해당 카테고리 쿼리만 무효화
      if (category === "tech") {
        queryClient.invalidateQueries(["posts", { category: "tech" }]);
      } else if (category === "life") {
        queryClient.invalidateQueries(["posts", { category: "life" }]);
      }

      // 폼 초기화
      setNewPostTitle("");
      console.log(`Invalidated queries for category: ${category}`);
    },
  });

  const handleCreatePost = () => {
    createPostMutation.mutate({
      title: newPostTitle,
      category: newPostCategory,
      content: `Content for ${newPostTitle}`, // API 요구사항인 content 필드 추가
    });
  };

  const allPostsData = allPosts as { posts: Post[] } | undefined;
  const techPostsData = techPosts as { posts: Post[] } | undefined;
  const lifePostsData = lifePosts as { posts: Post[] } | undefined;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Post Management - Dynamic Invalidation</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">동적 무효화 테스트</h3>
          <ul className="text-sm space-y-1">
            <li>• 새 게시물 생성 시 해당 카테고리 관련 쿼리만 무효화</li>
            <li>• 전체 목록과 생성된 게시물의 카테고리 목록이 업데이트됨</li>
            <li>• 다른 카테고리 목록은 영향받지 않음</li>
          </ul>
        </div>

        {/* 게시물 생성 폼 */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-4">새 게시물 작성</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              data-testid="new-post-title"
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="p-2 border rounded-md"
              placeholder="게시물 제목"
            />
            <select
              data-testid="post-category-select"
              value={newPostCategory}
              onChange={(e) => setNewPostCategory(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="tech">기술</option>
              <option value="life">라이프</option>
            </select>
            <button
              data-testid="create-post-btn"
              onClick={handleCreatePost}
              disabled={createPostMutation.isPending || !newPostTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {createPostMutation.isPending ? "생성 중..." : "게시물 생성"}
            </button>
          </div>
        </div>

        {/* 성공 메시지 */}
        {createPostMutation.isSuccess && (
          <div data-testid="post-created" className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800">게시물이 성공적으로 생성되었습니다!</p>
          </div>
        )}

        {/* 필터 버튼 */}
        <div className="space-x-2">
          <button
            data-testid="show-all-btn"
            onClick={() => setSelectedFilter(null)}
            className={`px-4 py-2 rounded ${
              selectedFilter === null
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            전체 보기
          </button>
          <button
            data-testid="filter-tech-btn"
            onClick={() => setSelectedFilter("tech")}
            className={`px-4 py-2 rounded ${
              selectedFilter === "tech"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            기술 글만
          </button>
          <button
            data-testid="filter-life-btn"
            onClick={() => setSelectedFilter("life")}
            className={`px-4 py-2 rounded ${
              selectedFilter === "life"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            라이프 글만
          </button>
        </div>

        {/* 게시물 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 전체 게시물 */}
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">
              전체 게시물
              <span data-testid="all-posts-count" className="ml-2 text-sm text-gray-500">
                ({allPostsData?.posts?.length || 0})
              </span>
            </h3>
            {allPostsLoading ? (
              <div>로딩 중...</div>
            ) : (
              <div data-testid="all-posts" className="space-y-2">
                {allPostsData?.posts?.map((post) => (
                  <div
                    key={post.id}
                    data-testid="post-item"
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="font-medium">{post.title}</div>
                    <div className="text-gray-500">{post.category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 기술 게시물 */}
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">
              기술 게시물
              <span data-testid="tech-posts-count" className="ml-2 text-sm text-gray-500">
                ({techPostsData?.posts?.length || 0})
              </span>
            </h3>
            {selectedFilter === "tech" && techPostsLoading ? (
              <div>로딩 중...</div>
            ) : selectedFilter === "tech" ? (
              <div data-testid="tech-posts" className="space-y-2">
                {techPostsData?.posts?.map((post) => (
                  <div
                    key={post.id}
                    data-testid="tech-post-item"
                    className="p-2 bg-blue-50 rounded text-sm"
                  >
                    <div className="font-medium">{post.title}</div>
                    <div className="text-blue-600">{post.category}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">기술 글만 보기를 선택하세요</div>
            )}
          </div>

          {/* 라이프 게시물 */}
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">
              라이프 게시물
              <span className="ml-2 text-sm text-gray-500">
                ({lifePostsData?.posts?.length || 0})
              </span>
            </h3>
            {selectedFilter === "life" && lifePostsLoading ? (
              <div>로딩 중...</div>
            ) : selectedFilter === "life" ? (
              <div data-testid="life-posts" className="space-y-2">
                {lifePostsData?.posts?.map((post) => (
                  <div
                    key={post.id}
                    data-testid="life-post-item"
                    className="p-2 bg-green-50 rounded text-sm"
                  >
                    <div className="font-medium">{post.title}</div>
                    <div className="text-green-600">{post.category}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">라이프 글만 보기를 선택하세요</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}