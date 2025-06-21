"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface Country {
  id: string;
  name: string;
  code: string;
}

interface State {
  id: string;
  name: string;
  countryId: string;
}

interface City {
  id: string;
  name: string;
  stateId: string;
}

interface ZipCode {
  id: string;
  code: string;
  cityId: string;
  area: string;
}

export default function FormDependenciesTest() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedZipCode, setSelectedZipCode] = useState<string>("");

  // 1단계: 국가 목록 (항상 로드)
  const { data: countries, isLoading: countriesLoading } = useQuery<Country[]>({
    cacheKey: ["countries"],
    queryFn: async () => {
      const response = await fetch("/api/geo/countries");
      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }
      return response.json() as Promise<Country[]>;
    },
  });

  // 2단계: 선택된 국가의 주/도 목록
  const { data: states, isLoading: statesLoading } = useQuery<State[]>({
    cacheKey: ["states", selectedCountry],
    queryFn: async () => {
      const response = await fetch(`/api/geo/states?countryId=${selectedCountry}`);
      if (!response.ok) {
        throw new Error("Failed to fetch states");
      }
      return response.json() as Promise<State[]>;
    },
    enabled: !!selectedCountry, // 국가가 선택된 경우에만 실행
  });

  // 3단계: 선택된 주/도의 도시 목록
  const { data: cities, isLoading: citiesLoading } = useQuery<City[]>({
    cacheKey: ["cities", selectedState],
    queryFn: async () => {
      const response = await fetch(`/api/geo/cities?stateId=${selectedState}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }
      return response.json() as Promise<City[]>;
    },
    enabled: !!selectedState, // 주/도가 선택된 경우에만 실행
  });

  // 4단계: 선택된 도시의 우편번호 목록
  const { data: zipCodes, isLoading: zipCodesLoading } = useQuery<ZipCode[]>({
    cacheKey: ["zipCodes", selectedCity],
    queryFn: async () => {
      const response = await fetch(`/api/geo/zipcodes?cityId=${selectedCity}`);
      if (!response.ok) {
        throw new Error("Failed to fetch zip codes");
      }
      return response.json() as Promise<ZipCode[]>;
    },
    enabled: !!selectedCity, // 도시가 선택된 경우에만 실행
  });

  // 선택 핸들러들 - 하위 선택을 초기화
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedState("");
    setSelectedCity("");
    setSelectedZipCode("");
    
    // E2E 테스트용 전역 상태
    (window as any).__FORM_DEPENDENCY_STATE__ = {
      country: countryId,
      state: "",
      city: "",
      zipCode: "",
      step: "country-selected",
    };
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedCity("");
    setSelectedZipCode("");
    
    (window as any).__FORM_DEPENDENCY_STATE__ = {
      country: selectedCountry,
      state: stateId,
      city: "",
      zipCode: "",
      step: "state-selected",
    };
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedZipCode("");
    
    (window as any).__FORM_DEPENDENCY_STATE__ = {
      country: selectedCountry,
      state: selectedState,
      city: cityId,
      zipCode: "",
      step: "city-selected",
    };
  };

  const handleZipCodeChange = (zipCodeId: string) => {
    setSelectedZipCode(zipCodeId);
    
    (window as any).__FORM_DEPENDENCY_STATE__ = {
      country: selectedCountry,
      state: selectedState,
      city: selectedCity,
      zipCode: zipCodeId,
      step: "zipcode-selected",
    };
  };

  const resetForm = () => {
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setSelectedZipCode("");
    
    (window as any).__FORM_DEPENDENCY_STATE__ = {
      country: "",
      state: "",
      city: "",
      zipCode: "",
      step: "reset",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            폼 의존성 쿼리 테스트
          </h1>

          {/* 쿼리 상태 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">필드 로딩 상태</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  countriesLoading ? "bg-blue-500" : 
                  countries ? "bg-green-500" : "bg-gray-300"
                }`}></div>
                <p>국가 {countriesLoading ? "로딩중" : "완료"}</p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  statesLoading ? "bg-blue-500" : 
                  states ? "bg-green-500" : "bg-gray-300"
                }`}></div>
                <p>주/도 {statesLoading ? "로딩중" : states ? "완료" : "대기"}</p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  citiesLoading ? "bg-blue-500" : 
                  cities ? "bg-green-500" : "bg-gray-300"
                }`}></div>
                <p>도시 {citiesLoading ? "로딩중" : cities ? "완료" : "대기"}</p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  zipCodesLoading ? "bg-blue-500" : 
                  zipCodes ? "bg-green-500" : "bg-gray-300"
                }`}></div>
                <p>우편번호 {zipCodesLoading ? "로딩중" : zipCodes ? "완료" : "대기"}</p>
              </div>
            </div>
          </div>

          {/* 주소 선택 폼 */}
          <div className="space-y-6">
            {/* 국가 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                국가 선택
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="country-select"
                disabled={countriesLoading}
              >
                <option value="">
                  {countriesLoading ? "국가 목록 로딩 중..." : "국가를 선택하세요"}
                </option>
                {countries?.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 주/도 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주/도 선택
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="state-select"
                disabled={!selectedCountry || statesLoading}
              >
                <option value="">
                  {!selectedCountry
                    ? "먼저 국가를 선택하세요"
                    : statesLoading
                    ? "주/도 목록 로딩 중..."
                    : "주/도를 선택하세요"}
                </option>
                {states?.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 도시 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                도시 선택
              </label>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="city-select"
                disabled={!selectedState || citiesLoading}
              >
                <option value="">
                  {!selectedState
                    ? "먼저 주/도를 선택하세요"
                    : citiesLoading
                    ? "도시 목록 로딩 중..."
                    : "도시를 선택하세요"}
                </option>
                {cities?.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 우편번호 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우편번호 선택
              </label>
              <select
                value={selectedZipCode}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="zipcode-select"
                disabled={!selectedCity || zipCodesLoading}
              >
                <option value="">
                  {!selectedCity
                    ? "먼저 도시를 선택하세요"
                    : zipCodesLoading
                    ? "우편번호 목록 로딩 중..."
                    : "우편번호를 선택하세요"}
                </option>
                {zipCodes?.map((zipCode) => (
                  <option key={zipCode.id} value={zipCode.id}>
                    {zipCode.code} - {zipCode.area}
                  </option>
                ))}
              </select>
            </div>

            {/* 폼 제어 버튼 */}
            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                data-testid="reset-form-btn"
              >
                폼 초기화
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!selectedZipCode}
                data-testid="submit-form-btn"
              >
                주소 확정
              </button>
            </div>
          </div>

          {/* 선택된 주소 정보 */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">선택된 주소 정보</h3>
            <div className="space-y-2 text-sm" data-testid="selected-address">
              <p>
                <strong>국가:</strong>{" "}
                {countries?.find(c => c.id === selectedCountry)?.name || "선택되지 않음"}
              </p>
              <p>
                <strong>주/도:</strong>{" "}
                {states?.find(s => s.id === selectedState)?.name || "선택되지 않음"}
              </p>
              <p>
                <strong>도시:</strong>{" "}
                {cities?.find(c => c.id === selectedCity)?.name || "선택되지 않음"}
              </p>
              <p>
                <strong>우편번호:</strong>{" "}
                {zipCodes?.find(z => z.id === selectedZipCode)?.code || "선택되지 않음"}
              </p>
              {selectedZipCode && (
                <p>
                  <strong>지역:</strong>{" "}
                  {zipCodes?.find(z => z.id === selectedZipCode)?.area}
                </p>
              )}
            </div>
          </div>

          {/* 의존성 설명 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">폼 의존성 동작</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>• <strong>국가 → 주/도</strong>: 국가 선택 시 해당 국가의 주/도 목록 로드</p>
              <p>• <strong>주/도 → 도시</strong>: 주/도 선택 시 해당 지역의 도시 목록 로드</p>
              <p>• <strong>도시 → 우편번호</strong>: 도시 선택 시 해당 도시의 우편번호 목록 로드</p>
              <p>• <strong>계층적 초기화</strong>: 상위 항목 변경 시 하위 항목들 자동 초기화</p>
              <p>• <strong>조건부 활성화</strong>: enabled 옵션으로 이전 단계 완료 시에만 쿼리 실행</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}