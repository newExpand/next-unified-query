"use client";

import { useQuery } from "../../lib/query-client";
import Link from "next/link";
import { useState } from "react";

// 페이지네이션 API 응답 타입
interface PaginationPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function PostsPaginationPage() {
  const [page, setPage] = useState(1);
  const limit = 8; // 한 페이지당 표시할 게시물 수

  const {
    data: posts,
    isLoading,
    error,
    isPlaceholderData,
    isFetching,
  } = useQuery<PaginationPost[]>({
    cacheKey: ["posts", "pagination", page],
    url: `/api/posts/page?page=${page}&limit=${limit}`,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  console.log("isPlaceholderData", isLoading, isPlaceholderData, isFetching);

  // 전체 게시물 수 (실제로는 API에서 받아와야 하지만 여기서는 mock 데이터 기준)
  const totalPosts = 50;
  const totalPages = Math.ceil(totalPosts / limit);

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  // 페이지 번호 표시 로직 (현재 페이지 기준으로 앞뒤 2페이지씩 표시)
  const getVisiblePages = () => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-red-600 text-center">
          게시물을 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">📄 게시물 페이지네이션</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            총 {totalPosts}개의 게시물 중 {page}페이지 표시 중
          </p>
          <div className="flex gap-2">
            <Link
              href="/posts"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              ← 무한 스크롤로 돌아가기
            </Link>
            <Link
              href="/posts/tanstack-pagination"
              className="px-4 py-2 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 transition-colors"
            >
              TanStack Query 버전
            </Link>
          </div>
        </div>
      </div>

      {/* 현재 페이지 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">현재 페이지 정보</h3>
            <p className="text-blue-600">
              페이지 {page} / {totalPages} (게시물 {(page - 1) * limit + 1}-
              {Math.min(page * limit, totalPosts)})
            </p>
          </div>
          <div className="text-2xl">{isLoading ? "⏳" : "📚"}</div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">게시물을 불러오는 중...</span>
          </div>
        </div>
      )}

      {/* 게시물 목록 */}
      {posts && (
        <div className="space-y-4 mb-8">
          {posts.map((post) => (
            <div
              key={post.id}
              data-testid={`post-item-${post.id}`}
              className="border border-gray-200 p-6 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Link href={`/posts/${post.id}`} className="block">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-xl text-gray-800 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    #{post.id}
                  </span>
                </div>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-4">✍️ {post.author}</span>
                    <span>
                      📅 {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <span className="text-blue-500 hover:text-blue-700">
                    자세히 보기 →
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 컨트롤 */}
      {posts && (
        <div className="flex flex-col items-center space-y-4">
          {/* 이전/다음 버튼 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousPage}
              disabled={page === 1 || isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              ← 이전 페이지
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded font-medium">
              {page} / {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={page === totalPages || isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              다음 페이지 →
            </button>
          </div>

          {/* 페이지 번호 버튼들 */}
          <div className="flex items-center space-x-2">
            {/* 첫 페이지로 가기 */}
            {page > 3 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="px-3 py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  1
                </button>
                {page > 4 && <span className="px-2">...</span>}
              </>
            )}

            {/* 현재 페이지 주변 페이지들 */}
            {getVisiblePages().map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => goToPage(pageNumber)}
                disabled={isLoading}
                className={`px-3 py-2 rounded transition-colors ${
                  pageNumber === page
                    ? "bg-blue-600 text-white font-medium"
                    : "hover:bg-gray-200 disabled:cursor-not-allowed"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            {/* 마지막 페이지로 가기 */}
            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && <span className="px-2">...</span>}
                <button
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* 페이지 점프 입력 */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">페이지로 이동:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const pageNum = parseInt(e.target.value);
                if (pageNum >= 1 && pageNum <= totalPages) {
                  goToPage(pageNum);
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              disabled={isLoading}
            />
            <span className="text-gray-600">/ {totalPages}</span>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {posts && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            게시물이 없습니다
          </h3>
          <p className="text-gray-500">
            이 페이지에는 표시할 게시물이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
