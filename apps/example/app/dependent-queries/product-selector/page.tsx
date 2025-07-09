"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";
import { 
  conditionalQueries, 
  type BrandsData, 
  type ModelsData, 
  type ProductSpecsData 
} from "../../lib/conditional-queries-factory";

export default function ProductSelectorPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  
  const queryClient = useQueryClient();

  // 1단계: 카테고리 선택 시 브랜드 목록 로드 (Factory 패턴 사용)
  const { data: brandsData, isLoading: brandsLoading } = useQuery<BrandsData>(
    conditionalQueries.productBrands,
    {
      params: selectedCategory,
      enabled: !!selectedCategory, // 카테고리가 선택되었을 때만 실행
    }
  );

  // 2단계: 브랜드 선택 시 모델 목록 로드 (Factory 패턴 사용)
  const { data: modelsData, isLoading: modelsLoading } = useQuery<ModelsData>(
    conditionalQueries.productModels,
    {
      params: [selectedCategory, selectedBrand],
      enabled: !!selectedCategory && !!selectedBrand, // 카테고리와 브랜드가 모두 선택되었을 때만 실행
    }
  );

  // 3단계: 모델 선택 시 제품 상세 정보 로드 (Factory 패턴 사용)
  const { data: productSpecs, isLoading: specsLoading } = useQuery<ProductSpecsData>(
    conditionalQueries.productSpecs,
    {
      params: selectedModel,
      enabled: !!selectedModel, // 모델이 선택되었을 때만 실행
    }
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedBrand(""); // 카테고리 변경 시 하위 선택 초기화
    setSelectedModel("");
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel(""); // 브랜드 변경 시 하위 선택 초기화
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            제품 선택기 (조건부 쿼리 체인)
          </h1>

          <form className="space-y-6" data-testid="product-form">
            {/* 1단계: 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1단계: 카테고리 선택
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="category-select"
              >
                <option value="">카테고리를 선택하세요</option>
                <option value="laptop">노트북</option>
                <option value="smartphone">스마트폰</option>
                <option value="tablet">태블릿</option>
              </select>
            </div>

            {/* 2단계: 브랜드 선택 */}
            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2단계: 브랜드 선택
                </label>
                {brandsLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">브랜드 목록 로딩 중...</span>
                  </div>
                ) : brandsData ? (
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="brand-select"
                  >
                    <option value="">브랜드를 선택하세요</option>
                    {brandsData.brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-600">브랜드 목록을 불러올 수 없습니다</p>
                )}
              </div>
            )}

            {/* 3단계: 모델 선택 */}
            {selectedCategory && selectedBrand && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3단계: 모델 선택
                </label>
                {modelsLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">모델 목록 로딩 중...</span>
                  </div>
                ) : modelsData ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="model-select"
                  >
                    <option value="">모델을 선택하세요</option>
                    {modelsData.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-600">모델 목록을 불러올 수 없습니다</p>
                )}
              </div>
            )}

            {/* 4단계: 제품 상세 정보 표시 */}
            {selectedModel && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  4단계: 제품 상세 정보
                </h3>
                {specsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">제품 정보 로딩 중...</p>
                  </div>
                ) : productSpecs ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="product-specs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">기본 정보</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">모델명:</span>
                            <span className="font-medium">{productSpecs.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">가격:</span>
                            <span className="font-medium text-green-600" data-testid="product-price">
                              ${productSpecs.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">재고 상태:</span>
                            <span className={`font-medium ${
                              productSpecs.availability === "In Stock" ? "text-green-600" : "text-red-600"
                            }`} data-testid="availability-status">
                              {productSpecs.availability}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3">사양</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">RAM:</span>
                            <span className="font-medium" data-testid="product-ram">
                              {productSpecs.specs.ram}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">저장공간:</span>
                            <span className="font-medium">{productSpecs.specs.storage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">디스플레이:</span>
                            <span className="font-medium">{productSpecs.specs.display}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    제품 정보를 불러올 수 없습니다
                  </div>
                )}
              </div>
            )}

            {/* 선택 요약 */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-3">선택 요약</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">카테고리:</span>
                    <span className="ml-2 font-medium">
                      {selectedCategory || "미선택"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">브랜드:</span>
                    <span className="ml-2 font-medium">
                      {selectedBrand || "미선택"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">모델:</span>
                    <span className="ml-2 font-medium">
                      {selectedModel || "미선택"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 쿼리 실행 상태 */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-3">쿼리 실행 상태</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>브랜드 목록 쿼리:</span>
                    <span className={`font-medium ${
                      !selectedCategory ? "text-gray-500" : 
                      brandsLoading ? "text-blue-600" : 
                      brandsData ? "text-green-600" : "text-red-600"
                    }`}>
                      {!selectedCategory ? "대기 중 (카테고리 미선택)" : 
                       brandsLoading ? "실행 중" : 
                       brandsData ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>모델 목록 쿼리:</span>
                    <span className={`font-medium ${
                      !selectedCategory || !selectedBrand ? "text-gray-500" : 
                      modelsLoading ? "text-blue-600" : 
                      modelsData ? "text-green-600" : "text-red-600"
                    }`}>
                      {!selectedCategory || !selectedBrand ? "대기 중 (브랜드 미선택)" : 
                       modelsLoading ? "실행 중" : 
                       modelsData ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>제품 상세 쿼리:</span>
                    <span className={`font-medium ${
                      !selectedModel ? "text-gray-500" : 
                      specsLoading ? "text-blue-600" : 
                      productSpecs ? "text-green-600" : "text-red-600"
                    }`}>
                      {!selectedModel ? "대기 중 (모델 미선택)" : 
                       specsLoading ? "실행 중" : 
                       productSpecs ? "완료" : "실패"}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-gray-600">
                      <strong>조건부 쿼리 체인:</strong> 카테고리 → 브랜드 → 모델 → 제품 상세 정보
                    </p>
                    <p className="text-gray-600 mt-1">
                      상위 선택이 변경되면 하위 선택들이 자동으로 초기화됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}