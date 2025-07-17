"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";
import { z } from "next-unified-query";

// 제품 스키마 정의
const ProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  price: z.number().positive(),
  categories: z.array(z.string()),
  metadata: z.object({
    weight: z.number().positive(),
    dimensions: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
      depth: z.number().positive().optional(),
    }),
  }),
});

type Product = z.infer<typeof ProductSchema>;

export default function ProductDetailsValidation() {
  const [environment, setEnvironment] = useState<"development" | "production">(
    () => {
      // 초기값을 글로벌 변수에서 가져옴
      if (typeof window !== "undefined") {
        return (window as any).__NEXT_UNIFIED_QUERY_ENV__ || "development";
      }
      return "development";
    }
  );

  useEffect(() => {
    // 환경 설정을 글로벌 변수에 저장
    (window as any).__NEXT_UNIFIED_QUERY_ENV__ = environment;
  }, [environment]);

  useEffect(() => {
    // 마운트 시 글로벌 환경 설정 다시 확인
    const globalEnv = (window as any).__NEXT_UNIFIED_QUERY_ENV__;
    if (globalEnv && globalEnv !== environment) {
      setEnvironment(globalEnv);
    }
  }, [environment]);

  const { data, error, isLoading } = useQuery<Product>({
    cacheKey: ["products", 1, environment],
    queryFn: async () => {
      const response = await fetch("/api/products/1");
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const rawData = await response.json();

      try {
        // Zod 스키마 검증
        const validatedData = ProductSchema.parse(rawData);

        // 검증 성공 시
        (window as any).__SCHEMA_VALIDATION_STATUS__ = "valid";
        (window as any).__SCHEMA_VALIDATION_ERRORS__ = [];

        return validatedData;
      } catch (validationError) {
        // 검증 실패 시 환경별 처리
        if (validationError instanceof z.ZodError) {
          const errors = validationError.issues;

          if (environment === "development") {
            // 개발 환경: 상세한 오류 정보
            (window as any).__SCHEMA_VALIDATION_ERRORS__ = errors.map(
              (err) => ({
                path: err.path,
                message: err.message,
                code: err.code,
              })
            );
          } else {
            // 프로덕션 환경: 최소한의 정보
            (window as any).__SCHEMA_VALIDATION_ERRORS__ = [
              {
                timestamp: new Date().toISOString(),
                endpoint: "/api/products/1",
                errorCount: errors.length,
              },
            ];
          }
        }

        (window as any).__SCHEMA_VALIDATION_STATUS__ = "invalid";
        throw validationError;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>제품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isSchemaError = error instanceof z.ZodError;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 환경 선택 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">환경 설정</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setEnvironment("development")}
                className={`px-4 py-2 rounded ${
                  environment === "development"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                개발 환경
              </button>
              <button
                onClick={() => setEnvironment("production")}
                className={`px-4 py-2 rounded ${
                  environment === "production"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                프로덕션 환경
              </button>
            </div>
          </div>

          {/* 스키마 검증 오류 */}
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6"
            data-testid="schema-validation-error"
          >
            <h1 className="text-xl font-bold text-red-900 mb-4">
              스키마 검증 오류
            </h1>

            {environment === "development" ? (
              <div data-testid="dev-error-console">
                <h3 className="font-medium text-red-800 mb-2">
                  개발 환경 - 상세 오류 정보
                </h3>
                {isSchemaError && (
                  <div
                    className="bg-red-100 p-4 rounded font-mono text-sm"
                    data-testid="detailed-error"
                  >
                    <div>ZodError Details:</div>
                    <pre>
                      path:{" "}
                      {JSON.stringify(
                        (error as z.ZodError).issues.map((e) => e.path),
                        null,
                        2
                      )}
                    </pre>
                    <div>Expected number, received string</div>
                    <pre>
                      {JSON.stringify((error as z.ZodError).issues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-red-800 mb-2">
                  프로덕션 환경 - 사용자 친화적 메시지
                </h3>
                <div
                  className="p-4 bg-red-100 rounded"
                  data-testid="user-error-message"
                >
                  데이터를 불러오는 중 문제가 발생했습니다.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 환경 선택 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">환경 설정</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setEnvironment("development")}
                className={`px-4 py-2 rounded ${
                  environment === "development"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                개발 환경
              </button>
              <button
                onClick={() => setEnvironment("production")}
                className={`px-4 py-2 rounded ${
                  environment === "production"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                프로덕션 환경
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              현재 환경: <strong>{environment}</strong>
            </p>
          </div>

          {/* 제품 정보 */}
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="product-details"
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                제품 상세 정보
              </h1>
              <span
                className="text-lg font-medium text-green-600"
                data-testid="schema-validation-status"
              >
                ✅ Valid
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    제품명
                  </label>
                  <p
                    className="text-lg text-gray-900"
                    data-testid="product-name"
                  >
                    {data.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    가격
                  </label>
                  <p
                    className="text-lg text-gray-900"
                    data-testid="product-price"
                  >
                    ${data.price}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    카테고리
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    무게
                  </label>
                  <p className="text-lg text-gray-900">
                    {data.metadata.weight}kg
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    크기
                  </label>
                  <p className="text-lg text-gray-900">
                    {data.metadata.dimensions.width} ×{" "}
                    {data.metadata.dimensions.height}
                    {data.metadata.dimensions.depth &&
                      ` × ${data.metadata.dimensions.depth}`}{" "}
                    cm
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">
                스키마 검증 성공
              </h3>
              <p className="text-sm text-gray-600">
                모든 필드가 정의된 Zod 스키마를 통과했습니다. (환경:{" "}
                {environment})
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
