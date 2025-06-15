"use client";
import { useState } from "react";
import { useQuery } from "next-type-fetch/react";
import { FetchError } from "next-type-fetch";
import { PostList } from "../post-factory";

export function PaginationPrevQueryExample() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, isFetching } = useQuery<
    PostList,
    FetchError
  >({
    key: ["posts", page],
    url: `/api/posts/page?page=${page}`,
    placeholderData: (prev: PostList, prevQuery) => {
      if (prev && prevQuery) {
        return prev.map((post) => ({
          ...post,
          title: `${post.title} (updatedAt: ${prevQuery.updatedAt})`,
        }));
      }
      return prev;
    },
  });

  console.log(
    `isPlaceholderData(prevQuery ${page})`,
    isPlaceholderData,
    isFetching
  );

  return (
    <div>
      <h2>PrevQuery Placeholder Example</h2>
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
