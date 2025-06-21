"use client";

import { useQuery } from "../../lib/query-client";
import { useState, useEffect, useMemo } from "react";

interface SearchResult {
  id: number;
  title: string;
  description: string;
  category: string;
  url: string;
  relevanceScore: number;
  lastUpdated: string;
}

export default function ConditionalSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // 디바운싱 구현
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 검색어가 3글자 이상일 때만 쿼리 실행
  const isSearchEnabled = useMemo(() => {
    const enabled = debouncedSearchTerm.trim().length >= 3;
    console.log("🔍 Search enabled:", enabled, "Term:", debouncedSearchTerm);
    return enabled;
  }, [debouncedSearchTerm]);

  const {
    data: searchResults,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<SearchResult[], any>({
    cacheKey: ["search-results", debouncedSearchTerm],
    queryFn: async (params, fetcher) => {
      console.log("🚀 실제 검색 실행:", { term: debouncedSearchTerm });

      // 내장 fetcher 사용
      const response = await fetcher.get("/api/search-results", {
        params: { q: debouncedSearchTerm },
      });
      return response.data;
    },
    enabled: isSearchEnabled, // 조건부 실행
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="conditional-search"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            조건부 검색 (3글자 이상 + 디바운싱)
          </h1>

          {/* 조건부 쿼리 설명 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">
              🔍 조건부 검색 동작
            </h3>
            <p className="text-blue-700 text-sm">
              검색어가 3글자 이상일 때만 API 호출이 실행됩니다. 300ms
              디바운싱으로 타이핑 중 불필요한 요청을 방지합니다.
            </p>
          </div>

          {/* 검색 입력 */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="검색어를 입력하세요 (최소 3글자)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="search-input"
              />

              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="clear-search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 검색 상태 표시 */}
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    searchTerm.length >= 3
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  입력: {searchTerm.length}글자
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    debouncedSearchTerm.length >= 3
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  디바운스: {debouncedSearchTerm.length}글자
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    isSearchEnabled
                      ? "bg-purple-100 text-purple-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  쿼리: {isSearchEnabled ? "활성" : "비활성"}
                </span>
              </div>

              {isFetching && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-xs">검색 중...</span>
                </div>
              )}
            </div>
          </div>

          {/* 검색 결과 영역 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🎯 검색 결과
            </h2>

            {!isSearchEnabled ? (
              <div
                className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center"
                data-testid="search-disabled"
              >
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-medium text-gray-600 mb-2">
                  검색어를 3글자 이상 입력하세요
                </h3>
                <p className="text-sm text-gray-500">
                  현재 입력: "{searchTerm}" ({searchTerm.length}글자)
                </p>
              </div>
            ) : isLoading ? (
              <div
                className="bg-blue-50 border border-blue-200 p-6 rounded-lg"
                data-testid="search-loading"
              >
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-4"></div>
                  <div>
                    <h3 className="font-medium text-blue-800">검색 중...</h3>
                    <p className="text-sm text-blue-600">
                      "{debouncedSearchTerm}" 검색 중
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">검색 실패</h3>
                <p className="text-sm text-red-700">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  다시 시도
                </button>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-4" data-testid="search-results">
                <div className="mb-4 text-sm text-gray-600">
                  "{debouncedSearchTerm}"에 대한 {searchResults.length}개의
                  결과를 찾았습니다.
                </div>

                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow"
                    data-testid="search-result-item"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {result.title}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {result.category}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">
                          {result.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            업데이트:{" "}
                            {new Date(result.lastUpdated).toLocaleDateString()}
                          </span>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            자세히 보기
                          </a>
                        </div>
                      </div>

                      <div className="ml-4 text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(result.relevanceScore * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">관련도</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-medium text-yellow-800 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-sm text-yellow-700">
                  "{debouncedSearchTerm}"에 대한 결과를 찾을 수 없습니다. 다른
                  검색어를 시도해보세요.
                </p>
              </div>
            )}
          </div>

          {/* 디바운싱 및 조건부 쿼리 상태 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              📊 쿼리 상태 및 최적화
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  ⚡ 디바운싱 상태
                </h4>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>현재 입력:</strong> "{searchTerm}"
                  </p>
                  <p>
                    <strong>디바운스된 값:</strong> "{debouncedSearchTerm}"
                  </p>
                  <p>
                    <strong>지연 시간:</strong> 300ms
                  </p>
                  <p>
                    <strong>상태:</strong>{" "}
                    {searchTerm === debouncedSearchTerm
                      ? "동기화됨"
                      : "대기 중"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">🔍 쿼리 상태</h4>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>활성화:</strong> {isSearchEnabled ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>로딩:</strong> {isLoading ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>패칭:</strong> {isFetching ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>결과 수:</strong>{" "}
                    {searchResults ? searchResults.length : 0}개
                  </p>
                  <p>
                    <strong>캐시 키:</strong> ["search-results", "
                    {debouncedSearchTerm}"]
                  </p>
                </div>
              </div>
            </div>

            {/* 최적화 기법 설명 */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3">
                💡 최적화 기법
              </h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>
                  • <strong>조건부 실행:</strong>{" "}
                  <code>enabled: debouncedSearchTerm.length &gt;= 3</code>로
                  최소 길이 제한
                </p>
                <p>
                  • <strong>디바운싱:</strong> 300ms 지연으로 타이핑 중 불필요한
                  API 호출 방지
                </p>
                <p>
                  • <strong>캐싱:</strong> 동일한 검색어에 대해서는 캐시된 결과
                  사용
                </p>
                <p>
                  • <strong>사용자 피드백:</strong> 실시간 상태 표시로 현재 진행
                  상황 안내
                </p>
              </div>
            </div>

            {/* 실제 구현 코드 */}
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">
                🔧 핵심 구현 코드
              </h4>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {`// 디바운싱
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// 조건부 쿼리
const { data } = useQuery({
  cacheKey: ["search-results", debouncedSearchTerm],
  queryFn: async (params, fetcher) => {
    const response = await fetcher.get("/api/search-results", {
      params: { q: debouncedSearchTerm }
    });
    return response.data;
  },
  enabled: debouncedSearchTerm.trim().length >= 3,
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
