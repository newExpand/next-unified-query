"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface ProductSearchResult {
  filters: {
    category: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    brand: string | null;
    inStock: string | null;
  };
  products: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  totalCount: number;
}

export default function AdvancedFilters() {
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [inStock, setInStock] = useState("");

  // 검색 쿼리 (카테고리가 선택되었을 때만 실행)
  const { data, isLoading, error, refetch } = useQuery<ProductSearchResult>({
    cacheKey: [
      "products",
      "search",
      category,
      minPrice,
      maxPrice,
      brand,
      inStock,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (category) searchParams.set("category", category);
      if (minPrice) searchParams.set("minPrice", minPrice);
      if (maxPrice) searchParams.set("maxPrice", maxPrice);
      if (brand) searchParams.set("brand", brand);
      if (inStock) searchParams.set("inStock", inStock);

      const response = await fetch(`/api/products/search?${searchParams}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }

      return response.json() as Promise<ProductSearchResult>;
    },
    enabled: !!category, // 카테고리가 선택되어야만 실행
  });

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setBrand("");
    setInStock("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="filter-form"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            고급 필터 검색
          </h1>

          {/* 필터 상태 표시 */}
          {!category ? (
            <div
              className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded"
              data-testid="filter-status"
            >
              카테고리를 선택해주세요
            </div>
          ) : (
            <div
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded"
              data-testid="filter-status"
            >
              검색 조건이 설정되었습니다. 필터를 적용하여 검색하세요.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* 카테고리 (필수) */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                카테고리 *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="category-filter"
              >
                <option value="">선택하세요</option>
                <option value="electronics">전자제품</option>
                <option value="clothing">의류</option>
                <option value="books">도서</option>
                <option value="home">홈/리빙</option>
              </select>
            </div>

            {/* 최소 가격 */}
            <div>
              <label
                htmlFor="minPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                최소 가격
              </label>
              <input
                id="minPrice"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="예: 100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="min-price-input"
              />
            </div>

            {/* 최대 가격 */}
            <div>
              <label
                htmlFor="maxPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                최대 가격
              </label>
              <input
                id="maxPrice"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="예: 1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="max-price-input"
              />
            </div>

            {/* 브랜드 */}
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                브랜드
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="brand-filter"
              >
                <option value="">모든 브랜드</option>
                <option value="Samsung">Samsung</option>
                <option value="Apple">Apple</option>
                <option value="Nike">Nike</option>
                <option value="Adidas">Adidas</option>
              </select>
            </div>

            {/* 재고 상태 */}
            <div>
              <label
                htmlFor="inStock"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                재고 상태
              </label>
              <select
                id="inStock"
                value={inStock}
                onChange={(e) => setInStock(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="stock-filter"
              >
                <option value="">전체</option>
                <option value="true">재고 있음</option>
                <option value="false">품절</option>
              </select>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-4">
            <button
              onClick={handleApplyFilters}
              disabled={!category}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              data-testid="apply-filters-btn"
            >
              필터 적용
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              data-testid="reset-filters-btn"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 검색 결과 */}
        {category && (
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
              <div data-testid="product-results">
                <div className="mb-4 text-sm text-gray-600">
                  <p>적용된 필터:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>카테고리: {data.filters.category || "전체"}</li>
                    {data.filters.minPrice && (
                      <li>최소 가격: ${data.filters.minPrice}</li>
                    )}
                    {data.filters.maxPrice && (
                      <li>최대 가격: ${data.filters.maxPrice}</li>
                    )}
                    {data.filters.brand && (
                      <li>브랜드: {data.filters.brand}</li>
                    )}
                    {data.filters.inStock && (
                      <li>
                        재고:{" "}
                        {data.filters.inStock === "true" ? "있음" : "없음"}
                      </li>
                    )}
                  </ul>
                  <p className="mt-2">총 {data.totalCount}개 상품</p>
                </div>

                {data.products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.products.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 border border-gray-200 rounded-lg"
                        data-testid="product-item"
                      >
                        <h3 className="font-medium text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-blue-600">
                          ${product.price}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    조건에 맞는 상품이 없습니다.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
