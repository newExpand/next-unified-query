"use client";
import { useState } from "react";
import { useQuery } from "next-type-fetch/react";

export function PaginationPrevExample() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, isLoading } = useQuery({
    key: ["posts", page],
    url: `/api/posts/page?page=${page}`,
    placeholderData: (prev) => prev, // prev만 사용
  });

  console.log(`isPlaceholderData(prev ${page})`, isPlaceholderData);

  return (
    <div style={{ marginBottom: 40 }}>
      <h2>Prev Only Placeholder Example</h2>
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
