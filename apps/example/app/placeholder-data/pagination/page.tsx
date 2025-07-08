"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

export default function PaginationPlaceholderDataPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    cacheKey: ["paginated-data", currentPage],
    url: `/api/paginated-data?page=${currentPage}`,
    placeholderData: (prevData: any, _prevQuery: any) => {
      // 이전 데이터가 있으면 유지하면서 placeholderData로 사용
      return prevData;
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Pagination with PlaceholderData
      </h1>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Previous Page
          </button>

          <span className="px-4 py-2">Page {currentPage}</span>

          <button
            data-testid="next-page-btn"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={data && !data.hasNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Next Page
          </button>
        </div>

        {isLoading && (
          <div data-testid="loading-indicator" className="text-blue-600">
            Loading new page...
          </div>
        )}

        {isPlaceholderData && (
          <div data-testid="placeholder-indicator" className="text-yellow-600">
            이전 페이지 데이터 표시 중...
          </div>
        )}

        {data && (
          <div
            data-testid="pagination-data"
            data-loading={isLoading}
            className="space-y-2"
          >
            {data.data?.map((item: string, index: number) => (
              <div
                key={index}
                data-testid="data-item"
                className="p-2 border rounded"
              >
                {item}
              </div>
            ))}
            <div className="text-sm text-gray-500">
              Page: {data.page}, Has Next: {data.hasNext ? "Yes" : "No"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
