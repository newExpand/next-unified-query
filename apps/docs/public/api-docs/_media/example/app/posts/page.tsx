"use client";

import { useQuery } from "../lib/query-client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Post } from "../api/db";

export default function PostsPage() {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<any[]>([]);

  const { data: posts, isLoading } = useQuery<Post[]>({
    cacheKey: ["posts", "page", page],
    url: `/api/posts/page?page=${page}&limit=10`,
    staleTime: 30000,
  });

  console.log(isLoading);

  useEffect(() => {
    if (posts && page === 1) {
      setAllPosts(posts);
    } else if (posts && page > 1) {
      setAllPosts((prev) => [...prev, ...posts]);
    }
  }, [posts, page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Posts with Pagination</h1>

      {/* 페이지네이션 옵션 링크 추가 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">
          📖 다른 페이지네이션 방식 체험하기
        </h3>
        <div className="flex gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
            현재: 무한 스크롤 (next-unified-query)
          </span>
          <Link
            href="/posts/pagination"
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
          >
            → 이전/다음 버튼 방식 보기
          </Link>
          <Link
            href="/posts/tanstack-pagination"
            className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200 transition-colors"
          >
            → TanStack Query 버전 보기
          </Link>
        </div>
      </div>

      <div data-testid="posts-list" className="space-y-4">
        {allPosts.map((post, index) => (
          <div
            key={`${post.id}-${index}`}
            data-testid={`post-item-${post.id}`}
            className="border p-4 rounded hover:bg-gray-50"
          >
            <Link href={`/posts/${post.id}`}>
              <h3 className="font-semibold text-lg">{post.title}</h3>
              <p className="text-gray-600 mt-2">{post.excerpt}</p>
              <div className="text-sm text-gray-500 mt-2">
                By {post.author} •{" "}
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </Link>
          </div>
        ))}
      </div>

      {isLoading && (
        <div data-testid="loading" className="text-center py-4">
          Loading more posts...
        </div>
      )}

      <div className="text-center mt-8">
        <button
          onClick={loadMore}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Load More Posts
        </button>
      </div>

      {/* Infinite scroll trigger */}
      <div
        className="h-4"
        ref={(el) => {
          if (el) {
            const observer = new IntersectionObserver(
              (entries) => {
                if (entries[0].isIntersecting && !isLoading) {
                  loadMore();
                }
              },
              { threshold: 1.0 }
            );
            observer.observe(el);
            return () => observer.disconnect();
          }
        }}
      />
    </div>
  );
}
