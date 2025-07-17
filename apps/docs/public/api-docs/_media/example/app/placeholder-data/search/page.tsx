"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface SearchResult {
  query: string;
  results: string[];
  timestamp: number;
}

export default function SearchPlaceholderDataPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const { data, isLoading, isPlaceholderData } = useQuery<SearchResult>({
    cacheKey: ["search-results", currentQuery],
    url: `/api/search-results?q=${currentQuery}`,
    enabled: !!currentQuery,
    placeholderData: (prevData: SearchResult | undefined, prevQuery: any) => {
      // placeholderData 함수가 받은 매개변수를 디버깅용으로 기록
      if (typeof window !== "undefined") {
        (window as any).__placeholderDataParams = {
          prevData: prevData?.query || "undefined",
          prevQuery: typeof prevQuery,
          hasData: !!prevData,
        };
      }

      return prevData;
    },
  });

  const handleSearch = () => {
    setCurrentQuery(searchQuery);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Search with PlaceholderData</h1>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <input
            data-testid="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
            className="px-3 py-2 border border-gray-300 rounded-md flex-1"
          />
          <button
            data-testid="search-btn"
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {isLoading && <div className="text-blue-600">Searching...</div>}

        {isPlaceholderData && (
          <div
            data-testid="placeholder-debug"
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <h3 className="font-semibold text-yellow-800">
              PlaceholderData Debug Info:
            </h3>
            <div
              data-testid="placeholder-params"
              className="text-sm text-yellow-700"
            >
              {typeof window !== "undefined" &&
              (window as any).__placeholderDataParams
                ? JSON.stringify((window as any).__placeholderDataParams)
                : "No debug info"}
            </div>
          </div>
        )}

        {data && (
          <div
            data-testid="search-results"
            data-loading={isLoading}
            className="space-y-2"
          >
            <h3 className="font-semibold">Results for: &quot;{data.query}&quot;</h3>
            {data.results?.map((result: string, index: number) => (
              <div
                key={index}
                data-testid="result-item"
                className="p-2 border rounded"
              >
                {result}
              </div>
            ))}
            <div className="text-sm text-gray-500">
              Search completed at:{" "}
              {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
