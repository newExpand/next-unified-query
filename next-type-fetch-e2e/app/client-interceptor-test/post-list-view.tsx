"use client";

import { postQueries } from "../factory";
import { useQuery } from "next-type-fetch/react";

export function PostListView({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery(postQueries.list, { userId });

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts: {String(error)}</div>;

  return (
    <div>
      <h3>Posts for user {userId}</h3>
      <ul>
        {data?.map((post: any) => (
          <li key={post.id}>
            <strong>{post.title}</strong>: {post.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
