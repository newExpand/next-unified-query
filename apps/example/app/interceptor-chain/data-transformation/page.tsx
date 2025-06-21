"use client";

import { useState } from "react";

export default function DataTransformation() {
  const [transformInterceptorsRegistered, setTransformInterceptorsRegistered] =
    useState(false);
  const [originalData, setOriginalData] = useState("");
  const [transformedRequestData, setTransformedRequestData] =
    useState<any>(null);
  const [finalResponseData, setFinalResponseData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerTransformInterceptors = () => {
    setTransformInterceptorsRegistered(true);
    (window as any).__TRANSFORM_INTERCEPTORS_REGISTERED__ = true;
  };

  const submitData = async () => {
    if (!originalData.trim()) return;

    setIsSubmitting(true);

    try {
      // 원본 데이터 파싱
      const parsedData = JSON.parse(originalData);

      // Request 인터셉터에서 데이터 변환 시뮬레이션
      const transformedRequest = {
        ...parsedData,
        name: parsedData.name?.toUpperCase(), // 대문자 변환
        value: parsedData.value ? parsedData.value * 2 : undefined, // 2배 증가
        timestamp: new Date().toISOString(), // ISO 형식으로 변환
        processedBy: "request-interceptor",
      };

      setTransformedRequestData(transformedRequest);

      // API 호출
      const response = await fetch("/api/transform-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedRequest),
      });

      if (!response.ok) {
        throw new Error("Transform test failed");
      }

      const result = await response.json();

      // Response 인터셉터에서 추가 변환 시뮬레이션
      const enhancedResponse = {
        ...result,
        enhancedBy: "response-interceptor",
        metadata: {
          processedAt: new Date().toISOString(),
          transformationSteps: [
            "request-transform",
            "api-process",
            "response-enhance",
          ],
        },
      };

      setFinalResponseData(enhancedResponse);
    } catch (error) {
      console.error("Data transformation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            데이터 변환 인터셉터 테스트
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 1: 변환 인터셉터 등록
              </h2>
              <button
                onClick={registerTransformInterceptors}
                disabled={transformInterceptorsRegistered}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                data-testid="register-transform-interceptors-btn"
              >
                {transformInterceptorsRegistered
                  ? "변환 인터셉터 등록됨"
                  : "변환 인터셉터 등록"}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 2: 원본 데이터 입력
              </h2>
              <textarea
                value={originalData}
                onChange={(e) => setOriginalData(e.target.value)}
                placeholder='{"name": "test", "value": 123, "timestamp": "2023-01-01"}'
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="original-data-input"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 3: 데이터 전송
              </h2>
              <button
                onClick={submitData}
                disabled={
                  !transformInterceptorsRegistered ||
                  !originalData.trim() ||
                  isSubmitting
                }
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                data-testid="submit-data-btn"
              >
                {isSubmitting ? "전송 중..." : "데이터 전송"}
              </button>
            </div>
          </div>
        </div>

        {/* Request 인터셉터 변환 결과 */}
        {transformedRequestData && (
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="transformation-complete"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Request 인터셉터 변환 결과
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="transformed-request"
            >
              {JSON.stringify(transformedRequestData, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">적용된 변환:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>name 필드: 대문자로 변환</li>
                <li>value 필드: 2배로 증가</li>
                <li>timestamp 필드: ISO 8601 형식으로 변환</li>
                <li>processedBy 필드: 추가됨</li>
              </ul>
            </div>
          </div>
        )}

        {/* Response 인터셉터 변환 결과 */}
        {finalResponseData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Response 인터셉터 최종 결과
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="final-response"
            >
              {JSON.stringify(finalResponseData, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Response 인터셉터에서 추가된 정보:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>enhancedBy: response-interceptor 표시</li>
                <li>metadata.processedAt: 처리 시각 추가</li>
                <li>metadata.transformationSteps: 변환 단계 정보</li>
              </ul>
            </div>
          </div>
        )}

        {/* 변환 흐름 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            데이터 변환 흐름
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>1. 원본 데이터:</strong> 사용자가 입력한 JSON 데이터
            </p>
            <p>
              <strong>2. Request 인터셉터:</strong> 데이터 정규화 및 추가 필드
              삽입
            </p>
            <p>
              <strong>3. API 처리:</strong> 서버에서 데이터 처리
            </p>
            <p>
              <strong>4. Response 인터셉터:</strong> 메타데이터 추가 및 최종
              가공
            </p>
            <p>
              <strong>5. 최종 결과:</strong> 클라이언트에서 사용할 준비가 된
              데이터
            </p>
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">현재 상태</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              변환 인터셉터 등록:{" "}
              {transformInterceptorsRegistered ? "✅ 완료" : "❌ 미완료"}
            </p>
            <p>
              Request 변환: {transformedRequestData ? "✅ 완료" : "❌ 미완료"}
            </p>
            <p>Response 변환: {finalResponseData ? "✅ 완료" : "❌ 미완료"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
