"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface SearchFilters {
  category: string;
  brand: string;
  priceRange: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  categoryId: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
}

export default function ConditionalSearchTest() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    category: "",
    brand: "",
    priceRange: "",
  });

  // 디바운스된 검색어 (500ms 지연)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 검색 조건 체크 (최소 3글자 이상 또는 필터 선택)
  const shouldSearch = useMemo(() => {
    return (
      debouncedSearchTerm.trim().length >= 3 ||
      !!filters.category ||
      !!filters.brand ||
      !!filters.priceRange
    );
  }, [debouncedSearchTerm, filters]);

  // 1단계: 카테고리 목록 (항상 로드)
  const { data: categories, isLoading: categoriesLoading } = useQuery<
    Category[],
    FetchError
  >({
    cacheKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/search/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json() as Promise<Category[]>;
    },
  });

  // 2단계: 선택된 카테고리의 브랜드 목록
  const { data: brands, isLoading: brandsLoading } = useQuery<
    Brand[],
    FetchError
  >({
    cacheKey: ["brands", filters.category],
    queryFn: async () => {
      const response = await fetch(
        `/api/search/brands?categoryId=${filters.category}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch brands");
      }
      return response.json() as Promise<Brand[]>;
    },
    enabled: !!filters.category, // 카테고리가 선택된 경우에만 실행
  });

  // 3단계: 검색 결과 (검색 조건이 충족된 경우에만)
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery<Product[], FetchError>({
    cacheKey: [
      "search",
      debouncedSearchTerm,
      filters.category,
      filters.brand,
      filters.priceRange,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
      if (filters.category) params.append("category", filters.category);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.priceRange) params.append("priceRange", filters.priceRange);

      const response = await fetch(`/api/search/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to search products");
      }
      return response.json() as Promise<Product[]>;
    },
    enabled: shouldSearch, // 검색 조건이 충족된 경우에만 실행
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });

  // 검색 관련 통계 (검색 결과가 있을 때만)
  const { data: searchStats } = useQuery<
    {
      total: number;
      byCategory: Record<string, number>;
      avgPrice: number;
    },
    FetchError
  >({
    cacheKey: [
      "search-stats",
      debouncedSearchTerm,
      filters.category,
      filters.brand,
      filters.priceRange,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (debouncedSearchTerm) params.append("q", debouncedSearchTerm);
      if (filters.category) params.append("category", filters.category);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.priceRange) params.append("priceRange", filters.priceRange);

      const response = await fetch(`/api/search/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch search stats");
      }
      return response.json();
    },
    enabled: shouldSearch && !!searchResults, // 검색 결과가 있을 때만 실행
  });

  const handleFilterChange = (
    filterType: keyof SearchFilters,
    value: string
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterType]: value };

      // 카테고리 변경 시 브랜드 초기화
      if (filterType === "category") {
        newFilters.brand = "";
      }

      return newFilters;
    });

    // E2E 테스트용 전역 상태
    (window as any).__CONDITIONAL_SEARCH_STATE__ = {
      searchTerm: debouncedSearchTerm,
      filters: { ...filters, [filterType]: value },
      shouldSearch,
      timestamp: Date.now(),
    };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      category: "",
      brand: "",
      priceRange: "",
    });

    (window as any).__CONDITIONAL_SEARCH_STATE__ = {
      searchTerm: "",
      filters: { category: "", brand: "", priceRange: "" },
      shouldSearch: false,
      timestamp: Date.now(),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            조건부 검색 쿼리 테스트
          </h1>

          {/* 검색 상태 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">검색 상태</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    searchTerm !== debouncedSearchTerm
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                ></div>
                <p>
                  검색어{" "}
                  {searchTerm !== debouncedSearchTerm ? "입력중" : "완료"}
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    shouldSearch ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <p>검색 조건 {shouldSearch ? "충족" : "미충족"}</p>
              </div>
              <div className="text-center">
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    searchLoading
                      ? "bg-blue-500"
                      : searchResults
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
                <p>
                  검색{" "}
                  {searchLoading ? "실행중" : searchResults ? "완료" : "대기"}
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    searchStats ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                <p>통계 {searchStats ? "완료" : "대기"}</p>
              </div>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* 검색어 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품 검색 (최소 3글자)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제품명 검색..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="search-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                입력중: {searchTerm.length}글자 | 검색:{" "}
                {debouncedSearchTerm.length}글자
              </p>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="category-filter"
                disabled={categoriesLoading}
              >
                <option value="">전체 카테고리</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 브랜드 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드
              </label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="brand-filter"
                disabled={!filters.category || brandsLoading}
              >
                <option value="">
                  {!filters.category
                    ? "먼저 카테고리를 선택하세요"
                    : brandsLoading
                    ? "브랜드 로딩 중..."
                    : "전체 브랜드"}
                </option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 가격대 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격대
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) =>
                  handleFilterChange("priceRange", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="price-filter"
              >
                <option value="">전체 가격</option>
                <option value="0-50000">5만원 이하</option>
                <option value="50000-100000">5-10만원</option>
                <option value="100000-500000">10-50만원</option>
                <option value="500000-">50만원 이상</option>
              </select>
            </div>
          </div>

          {/* 필터 제어 */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {shouldSearch ? (
                <span className="text-green-600">✓ 검색 조건 충족됨</span>
              ) : (
                <span className="text-orange-600">
                  ⚠ 검색어 3글자 이상 입력하거나 필터를 선택하세요
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
              data-testid="clear-filters-btn"
            >
              필터 초기화
            </button>
          </div>

          {/* 검색 결과 */}
          {shouldSearch && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                검색 결과
              </h2>

              {searchLoading && (
                <div className="text-center py-8" data-testid="search-loading">
                  <p>검색 중...</p>
                </div>
              )}

              {searchError && (
                <div className="text-center py-8 text-red-600">
                  <p>검색 중 오류가 발생했습니다: {searchError.message}</p>
                </div>
              )}

              {searchResults && (
                <div data-testid="search-results">
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white border rounded-lg p-4"
                        >
                          <h4 className="font-medium text-gray-900">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {product.brand}
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.category}
                          </p>
                          <p className="text-lg font-bold text-blue-600 mt-2">
                            ₩{product.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {product.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>검색 결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 검색 통계 */}
              {searchStats && (
                <div
                  className="mt-6 bg-gray-50 rounded-lg p-4"
                  data-testid="search-stats"
                >
                  <h3 className="font-medium text-gray-900 mb-3">검색 통계</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">총 결과 수</p>
                      <p className="text-lg font-bold text-blue-600">
                        {searchStats.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">평균 가격</p>
                      <p className="text-lg font-bold text-green-600">
                        ₩{Math.round(searchStats.avgPrice).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">카테고리별 분포</p>
                      <div className="text-xs">
                        {Object.entries(searchStats.byCategory).map(
                          ([category, count]) => (
                            <p key={category}>
                              {category}: {count}개
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 조건부 검색 설명 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">
              조건부 검색 동작
            </h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                • <strong>검색어 디바운싱</strong>: 입력 후 500ms 지연으로
                불필요한 API 호출 방지
              </p>
              <p>
                • <strong>조건부 실행</strong>: 검색어 3글자 이상 또는 필터 선택
                시에만 검색 실행
              </p>
              <p>
                • <strong>계층적 필터</strong>: 카테고리 선택 시 해당 브랜드
                목록 로드
              </p>
              <p>
                • <strong>종속 통계</strong>: 검색 결과가 있을 때만 통계 정보
                조회
              </p>
              <p>
                • <strong>캐시 관리</strong>: 5분간 검색 결과 캐시하여 재검색 시
                빠른 응답
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
