"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";
import {
  conditionalQueries,
  type AddressLookupData,
  type NeighborhoodData,
} from "../../lib/conditional-queries-factory";

export default function AddressFormPage() {
  const [zipCode, setZipCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [debouncedZipCode, setDebouncedZipCode] = useState("");

  // Debounce zipCode input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedZipCode(zipCode);
    }, 500);

    return () => clearTimeout(timer);
  }, [zipCode]);

  // 1단계: 우편번호 → 주소 조회 (Factory 패턴 사용)
  const { data: addressData, isLoading: addressLoading } =
    useQuery<AddressLookupData>(conditionalQueries.addressLookup, {
      params: debouncedZipCode,
      enabled: debouncedZipCode.length >= 5, // 5자리 이상일 때만 실행
    });

  // 2단계: 도시 결정 시 동네 정보 자동 로드 (Factory 패턴 사용)
  const { data: neighborhoodData, isLoading: neighborhoodLoading } =
    useQuery<NeighborhoodData>(conditionalQueries.neighborhoodInfo, {
      params: addressData?.city || "",
      enabled: !!addressData?.city, // 도시가 결정되었을 때만 실행
    });

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZipCode(value);

    // 우편번호 변경 시 선택된 주소 초기화
    setSelectedAddress("");
  };

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            주소 자동완성 폼 (조건부 쿼리 체인)
          </h1>

          <form className="space-y-6" data-testid="address-form">
            {/* 우편번호 입력 */}
            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                우편번호 (5자리 이상 입력)
              </label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={handleZipCodeChange}
                placeholder="12345"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="zip-code-input"
              />
              <p className="mt-1 text-sm text-gray-500">
                5자리 이상 입력하면 주소 검색이 시작됩니다 (디바운스 500ms)
              </p>
            </div>

            {/* 주소 검색 결과 */}
            {debouncedZipCode.length >= 5 && (
              <div className="space-y-4">
                {addressLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      주소 검색 중...
                    </p>
                  </div>
                ) : addressData ? (
                  <div className="space-y-4">
                    {/* 감지된 도시/주 정보 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 mb-2">
                        감지된 지역 정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">도시:</span>
                          <span
                            className="ml-2 font-medium"
                            data-testid="detected-city"
                          >
                            {addressData.city}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">주/도:</span>
                          <span
                            className="ml-2 font-medium"
                            data-testid="detected-state"
                          >
                            {addressData.state}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 주소 제안 목록 */}
                    {addressData.suggestions.length > 0 && (
                      <div data-testid="address-suggestions">
                        <h3 className="font-medium text-gray-900 mb-3">
                          주소 제안
                        </h3>
                        <div className="space-y-2">
                          {addressData.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleAddressSelect(suggestion)}
                              className={`w-full text-left p-3 rounded-md border transition-colors ${
                                selectedAddress === suggestion
                                  ? "border-blue-500 bg-blue-50 text-blue-900"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              data-testid="address-suggestion"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    올바른 우편번호를 입력해주세요
                  </div>
                )}
              </div>
            )}

            {/* 동네 정보 (도시가 결정되면 자동 로드) */}
            {addressData?.city && (
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-3">동네 정보</h3>

                  {neighborhoodLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">
                        동네 정보 로딩 중...
                      </p>
                    </div>
                  ) : neighborhoodData ? (
                    <div
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      data-testid="neighborhood-info"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            주요 동네
                          </h4>
                          <div className="space-y-1">
                            {neighborhoodData.neighborhoods.map(
                              (neighborhood, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-white px-2 py-1 rounded text-sm border mr-2 mb-1"
                                  data-testid="neighborhood-option"
                                >
                                  {neighborhood}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            평균 임대료
                          </h4>
                          <span
                            className="text-lg font-bold text-green-600"
                            data-testid="average-rent"
                          >
                            ${neighborhoodData.averageRent.toLocaleString()}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            월 평균 임대료
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      동네 정보를 불러올 수 없습니다
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 선택된 주소 표시 */}
            {selectedAddress && (
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">선택된 주소</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    {selectedAddress}
                  </p>
                </div>
              </div>
            )}

            {/* 쿼리 실행 상태 표시 */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-3">쿼리 실행 상태</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>주소 조회 쿼리:</span>
                    <span
                      className={`font-medium ${
                        debouncedZipCode.length < 5
                          ? "text-gray-500"
                          : addressLoading
                          ? "text-blue-600"
                          : addressData
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {debouncedZipCode.length < 5
                        ? "대기 중 (5자리 미만)"
                        : addressLoading
                        ? "실행 중"
                        : addressData
                        ? "완료"
                        : "실패"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>동네 정보 쿼리:</span>
                    <span
                      className={`font-medium ${
                        !addressData?.city
                          ? "text-gray-500"
                          : neighborhoodLoading
                          ? "text-blue-600"
                          : neighborhoodData
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {!addressData?.city
                        ? "대기 중 (도시 미확정)"
                        : neighborhoodLoading
                        ? "실행 중"
                        : neighborhoodData
                        ? "완료"
                        : "실패"}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-gray-600">
                      조건부 쿼리 체인: 우편번호 (5자리) → 주소 조회 → 동네 정보
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
