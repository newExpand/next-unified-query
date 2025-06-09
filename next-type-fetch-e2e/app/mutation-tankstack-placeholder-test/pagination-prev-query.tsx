"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function PaginationPrevQueryExample() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData } = useQuery({
    queryKey: ["posts", page],
    queryFn: () =>
      fetch(`/api/posts/page?page=${page}`).then((res) => res.json()),
    placeholderData: (prev, prevQuery) => {
      if (prev && prevQuery) {
        return prev.map((post) => ({
          ...post,
          title: `${post.title} (updatedAt: ${prevQuery.state.dataUpdatedAt})`,
        }));
      }
      return prev;
    },
  });

  return (
    <div>
      <h2>PrevQuery Placeholder Example (TanStack)</h2>
      <button onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
      <button onClick={() => setPage((p) => p + 1)}>다음</button>
      <div>isPlaceholderData: {String(isPlaceholderData)}</div>
      <ul>
        {Array.isArray(data) &&
          data.map((post) => (
            <li key={post.id}>
              {post.title} {isPlaceholderData && <span>(placeholder)</span>}
            </li>
          ))}
      </ul>
    </div>
  );
}
