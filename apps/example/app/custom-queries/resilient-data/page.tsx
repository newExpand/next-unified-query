"use client";

import { useQuery } from "../../lib/query-client";
import { useState } from "react";

interface ResilientData {
  data: string;
  timestamp: string;
  attempts: number;
  source: string;
}

export default function ResilientDataPage() {
  const [forceFailure, setForceFailure] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<ResilientData, any>({
    cacheKey: ["resilient-data", forceFailure],
    queryFn: async () => {
      let lastError: Error | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries}`);

          const response = await fetch(
            `/api/unstable-endpoint?forceFailure=${forceFailure}&attempt=${attempt}`,
            {
              headers: {
                "Cache-Control": "no-cache",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log(`Success on attempt ${attempt}:`, result);

          return {
            ...result,
            attempts: attempt,
            source: "primary-api",
          };
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          lastError = error as Error;

          // 마지막 시도가 아니면 잠시 대기
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // 모든 재시도 실패 시 폴백 데이터 시도
      try {
        console.log("Trying fallback data source...");
        const fallbackResponse = await fetch("/api/fallback-data");

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          return {
            data: fallbackResult.message,
            timestamp: new Date().toISOString(),
            attempts: maxRetries + 1,
            source: "fallback-api",
          };
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }

      // 모든 것이 실패하면 마지막 에러를 던짐
      throw lastError || new Error("All retry attempts failed");
    },
    // 커스텀 재시도 로직을 사용하므로 내장 재시도 옵션은 제거,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            복원력 있는 데이터 조회 (Resilient Data Fetching)
          </h1>

          {/* 제어 패널 */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-blue-800 mb-4">🎛️ 테스트 제어</h2>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={forceFailure}
                  onChange={(e) => setForceFailure(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-blue-700">실패 강제 발생</span>
              </label>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "조회 중..." : "다시 조회"}
              </button>
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    데이터 조회 중
                  </h3>
                  <p className="text-sm text-yellow-700">
                    재시도 로직이 실행 중입니다...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 성공 상태 */}
          {data && (
            <div
              className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6"
              data-testid="resilient-data"
            >
              <h3 className="font-semibold text-green-800 mb-4">
                ✅ 데이터 조회 성공!
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded">
                  <h4 className="font-medium text-green-800 mb-2">
                    응답 데이터
                  </h4>
                  <p className="text-sm text-green-700 mb-2">{data.data}</p>
                  <p className="text-xs text-green-600">
                    조회 시간: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-4 rounded">
                  <h4 className="font-medium text-green-800 mb-2">
                    복원력 정보
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>시도 횟수:</strong> {data.attempts}회
                    </p>
                    <p>
                      <strong>데이터 소스:</strong>
                      <span
                        className={`ml-1 px-2 py-1 rounded text-xs ${
                          data.source === "primary-api"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {data.source === "primary-api" ? "주 API" : "폴백 API"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 시도 히스토리 */}
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <h5 className="font-medium text-gray-800 mb-2">
                  📊 시도 히스토리
                </h5>
                <div className="flex space-x-2">
                  {Array.from({ length: data.attempts }, (_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < data.attempts - 1
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                  {data.source === "fallback-api" && (
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                      F
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  빨간색: 실패, 초록색: 성공, 주황색: 폴백
                </p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-red-800 mb-4">
                ❌ 모든 시도 실패
              </h3>
              <div className="text-sm text-red-700 space-y-2">
                <p>
                  <strong>최종 에러:</strong> {error.message}
                </p>
                <p>주 API와 폴백 API 모두 실패했습니다.</p>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => refetch()}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  🔄 재시도
                </button>
              </div>
            </div>
          )}

          {/* 복원력 전략 설명 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">🛡️ 복원력 전략</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h4 className="font-medium text-blue-800 mb-2">1. 재시도</h4>
                <p className="text-sm text-blue-700">
                  최대 3회까지 지수 백오프로 재시도
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <h4 className="font-medium text-green-800 mb-2">2. 폴백</h4>
                <p className="text-sm text-green-700">
                  주 API 실패 시 대체 API 사용
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                <h4 className="font-medium text-purple-800 mb-2">
                  3. 서킷 브레이커
                </h4>
                <p className="text-sm text-purple-700">
                  연속 실패 시 일시적 차단
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded">
                <h4 className="font-medium text-orange-800 mb-2">
                  4. 타임아웃
                </h4>
                <p className="text-sm text-orange-700">응답 시간 제한 설정</p>
              </div>
            </div>
          </div>

          {/* 기술적 세부사항 */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">🔧 구현 세부사항</h4>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {`// 재시도 로직 예제
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    if (attempt < maxRetries) {
      await sleep(1000 * attempt); // 지수 백오프
    }
  }
}

// 폴백 데이터 시도
try {
  return await fetchFallbackData();
} catch {
  throw lastError;
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
