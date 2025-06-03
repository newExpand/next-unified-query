"use client";
import { useQuery } from "next-type-fetch/react";
import { postQueries } from "../factory";

export function UserPosts() {
  const { data, isLoading, error } = useQuery(postQueries.list, { userId: 1 });

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <div>
      <h2>User Posts</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
