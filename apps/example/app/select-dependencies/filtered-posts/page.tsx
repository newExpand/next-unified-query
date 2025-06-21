"use client";

import { useState, useRef } from "react";
import { useQuery } from "../../lib/query-client";

export default function FilteredPostsSelectDependenciesPage() {
  const [categoryFilter, setCategoryFilter] = useState("tech");
  const selectExecutionCountRef = useRef(0);

  const { data, isLoading } = useQuery({
    cacheKey: ["posts-with-filter", categoryFilter],
    url: "/api/posts-with-filter",
    select: (data: any) => {
      selectExecutionCountRef.current++;

      return data.posts.filter((post: any) => post.category === categoryFilter);
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Select Dependencies Test</h1>

      <div className="space-y-4">
        <div data-testid="select-execution-count">
          Select executions: {selectExecutionCountRef.current}
        </div>

        <div>
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category Filter:
          </label>
          <select
            id="category-filter"
            data-testid="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="tech">Tech</option>
            <option value="personal">Personal</option>
            <option value="all">All</option>
          </select>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div data-testid="posts-list" className="space-y-2">
            {data?.map((post: any) => (
              <div
                key={post.id}
                data-testid="post-item"
                className="p-3 border border-gray-200 rounded"
              >
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-gray-600">
                  Category: {post.category}
                </p>
                <p className="text-sm text-gray-500">Likes: {post.likes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
