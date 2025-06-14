"use client";

import Link from "next/link";
import { PostList, postQueries } from "../post-factory";
import { useQuery } from "next-type-fetch/react";

export function PostListView({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery<PostList>(postQueries.list, {
    params: { userId },
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts: {String(error)}</div>;

  return (
    <div>
      <h3>Posts for user {userId}</h3>
      <ul>
        {Array.isArray(data) &&
          data.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>: {post.body}
            </li>
          ))}
      </ul>
      <a href="/mutation-placeholder-test">
        mutation-placeholder-test 페이지로 이동
      </a>
    </div>
  );
}
