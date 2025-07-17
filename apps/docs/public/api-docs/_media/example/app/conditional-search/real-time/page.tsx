"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";
import { 
  conditionalQueries, 
  type SearchResult 
} from "../../lib/conditional-queries-factory";

export default function RealTimeSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // 검색 쿼리 (Factory 패턴 사용 - 최소 3자 이상일 때만 실행)
  const { data, isLoading, error } = useQuery<SearchResult>(
    conditionalQueries.searchRealTime,
    {
      params: { query: debouncedQuery, category },
      enabled: debouncedQuery.length >= 3, // 3자 이상일 때만 실행
    }
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="search-form"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            실시간 검색 (디바운싱)
          </h1>

          <div className="space-y-4">
            {/* 검색 입력 */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                검색어 (최소 3자)
              </label>
              <input
                id="search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="javascript, react, node 등..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="search-input"
              />
              <p className="text-sm text-gray-500 mt-1">
                입력한 글자 수: {query.length} / 최소 필요: 3
              </p>
            </div>

            {/* 카테고리 필터 */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                카테고리
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="category-filter"
              >
                <option value="all">전체</option>
                <option value="tutorials">튜토리얼</option>
                <option value="documentation">문서</option>
                <option value="examples">예제</option>
                <option value="libraries">라이브러리</option>
              </select>
            </div>

            {/* 검색 상태 표시 */}
            <div className="text-sm text-gray-600">
              <p>
                현재 검색어: <strong>{debouncedQuery || "(없음)"}</strong>
              </p>
              <p>
                디바운싱 상태:{" "}
                {query !== debouncedQuery ? "대기 중..." : "완료"}
              </p>
              <p>
                쿼리 실행:{" "}
                {debouncedQuery.length >= 3 ? "활성화" : "비활성화 (3자 미만)"}
              </p>
            </div>
          </div>
        </div>

        {/* 검색 결과 */}
        {debouncedQuery.length >= 3 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              검색 결과
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">검색 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">검색 중 오류가 발생했습니다.</p>
              </div>
            ) : data ? (
              <div data-testid="search-results">
                <div className="mb-4 text-sm text-gray-600">
                  <p>
                    검색어: <strong>{data.query}</strong>
                  </p>
                  <p>
                    카테고리: <strong>{data.category}</strong>
                  </p>
                  <p>총 {data.totalCount}개 결과</p>
                </div>

                {data.results.length > 0 ? (
                  <ul className="space-y-2">
                    {data.results.map((result, index) => (
                      <li
                        key={index}
                        className="p-3 bg-gray-50 rounded border"
                        data-testid="search-result"
                      >
                        {result}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* 안내 메시지 */}
        {debouncedQuery.length < 3 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              검색 안내
            </h3>
            <p className="text-blue-700">
              검색어를 3자 이상 입력하시면 자동으로 검색이 시작됩니다.
              디바운싱(500ms) 기능으로 타이핑을 멈춘 후 검색이 실행됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
