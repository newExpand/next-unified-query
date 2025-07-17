"use client";

import React from "react";
import { useQuery } from "../../lib/query-client";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  userId: string;
  title: string;
  body: string;
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = React.useState<string>("");

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<Post>({
    cacheKey: ["post", id],
    url: `/api/posts/${id}`,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="loading">Loading post...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="error-message" className="text-red-600">
          Post not found
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Static post (ID 1-10)인지 Dynamic post인지 구분
  const isStaticPost = id && parseInt(id) <= 10;

  return (
    <div className="container mx-auto p-8" data-testid="post-detail">
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-gray-600 text-white rounded"
      >
        ← Back to Posts
      </button>

      <article data-testid={isStaticPost ? "static-post" : "dynamic-post"}>
        <h1 className="text-3xl font-bold mb-4">{post?.title}</h1>
        <div className="text-gray-600 mb-6">User ID: {post?.userId}</div>
        <div className="prose max-w-none">
          <p>{post?.body}</p>
        </div>
      </article>
    </div>
  );
}
