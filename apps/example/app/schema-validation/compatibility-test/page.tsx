"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError, z } from "next-unified-query";

// 버전 1 스키마 (기본)
const UserSchemaV1 = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// 버전 2 스키마 (필드 추가)
const UserSchemaV2 = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  profile: z
    .object({
      bio: z.string().optional(),
      avatar: z.string().url().optional(),
    })
    .optional(),
});

// 버전 3 스키마 (필드 타입 변경)
const UserSchemaV3 = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  profile: z
    .object({
      bio: z.string().optional(),
      avatar: z.string().url().optional(),
    })
    .optional(),
  settings: z
    .object({
      theme: z.enum(["light", "dark"]).default("light"),
      notifications: z.boolean().default(true),
    })
    .optional(),
  createdAt: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }),
});

type UserV1 = z.infer<typeof UserSchemaV1>;
type UserV2 = z.infer<typeof UserSchemaV2>;
type UserV3 = z.infer<typeof UserSchemaV3>;

interface CompatibilityResult {
  version: string;
  success: boolean;
  data?: any;
  error?: string;
  migrationApplied?: boolean;
}

export default function CompatibilityTestPage() {
  const [testResults, setTestResults] = useState<CompatibilityResult[]>([]);
  const [currentSchema, setCurrentSchema] = useState<"v1" | "v2" | "v3">("v1");
  const [legacyUser, setLegacyUser] = useState<any>(null);
  const [modernUser, setModernUser] = useState<any>(null);

  // API 데이터 가져오기
  const {
    data: rawData,
    isLoading,
    refetch,
  } = useQuery<UserV1 | UserV2 | UserV3, FetchError>({
    cacheKey: ["compatibility-test"],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/compatibility-test");
      if (!response.ok) {
        throw new Error("Failed to fetch compatibility data");
      }
      return response.json();
    },
  });

  const testSchemaCompatibility = async () => {
    if (!rawData) {
      await refetch();
      return;
    }

    const results: CompatibilityResult[] = [];

    // V1 스키마 테스트
    try {
      const validatedV1 = UserSchemaV1.parse(rawData);
      results.push({
        version: "v1",
        success: true,
        data: validatedV1,
      });
    } catch (error) {
      results.push({
        version: "v1",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // V2 스키마 테스트 (하위 호환성)
    try {
      const validatedV2 = UserSchemaV2.parse(rawData);
      results.push({
        version: "v2",
        success: true,
        data: validatedV2,
      });
    } catch (error) {
      results.push({
        version: "v2",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // V3 스키마 테스트 (마이그레이션 포함)
    try {
      const validatedV3 = UserSchemaV3.parse(rawData);
      results.push({
        version: "v3",
        success: true,
        data: validatedV3,
        migrationApplied: true,
      });
    } catch (error) {
      results.push({
        version: "v3",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setTestResults(results);
  };

  const loadLegacyUser = async () => {
    try {
      const response = await fetch("/api/users/legacy");
      const data = await response.json();
      setLegacyUser(data);
    } catch (error) {
      console.error("레거시 사용자 로드 실패:", error);
    }
  };

  const loadModernUser = async () => {
    try {
      const response = await fetch("/api/users/modern");
      const data = await response.json();
      setModernUser(data);
    } catch (error) {
      console.error("모던 사용자 로드 실패:", error);
    }
  };

  const getCurrentSchema = () => {
    switch (currentSchema) {
      case "v1":
        return UserSchemaV1;
      case "v2":
        return UserSchemaV2;
      case "v3":
        return UserSchemaV3;
      default:
        return UserSchemaV1;
    }
  };

  const getCurrentSchemaName = () => {
    switch (currentSchema) {
      case "v1":
        return "User Schema V1 (기본)";
      case "v2":
        return "User Schema V2 (옵셔널 필드)";
      case "v3":
        return "User Schema V3 (마이그레이션)";
      default:
        return "User Schema V1";
    }
  };

  // 현재 선택된 스키마로 데이터 검증
  const { data: currentValidatedData, isLoading: validating } = useQuery<
    any,
    FetchError
  >({
    cacheKey: ["schema-test", currentSchema],
    enabled: !!rawData,
    queryFn: async () => {
      const schema = getCurrentSchema();
      return schema.parse(rawData);
    },
    schema: getCurrentSchema(),
  });

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          스키마 호환성 및 마이그레이션 테스트
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">테스트 시나리오</h2>
          <div className="space-y-2 text-gray-600 mb-4">
            <p>
              • <strong>V1:</strong> 기본 필드만 (id, name, email)
            </p>
            <p>
              • <strong>V2:</strong> 옵셔널 profile 필드 추가 (하위 호환성)
            </p>
            <p>
              • <strong>V3:</strong> 설정 필드 추가 및 날짜 타입 변환
            </p>
            <p>• 각 스키마 버전간 호환성 및 마이그레이션 가능성 테스트</p>
          </div>

          <div className="space-x-4">
            <button
              data-testid="load-data-btn"
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "로딩 중..." : "데이터 로드"}
            </button>

            <button
              data-testid="test-compatibility-btn"
              onClick={testSchemaCompatibility}
              disabled={!rawData}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              호환성 테스트 실행
            </button>

            <button
              data-testid="load-legacy-user-btn"
              onClick={loadLegacyUser}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              레거시 사용자 로드
            </button>

            <button
              data-testid="load-modern-user-btn"
              onClick={loadModernUser}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              모던 사용자 로드
            </button>
          </div>
        </div>

        {/* 스키마 선택 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">현재 스키마 선택</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentSchema("v1")}
              className={`px-4 py-2 rounded ${
                currentSchema === "v1"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Schema V1
            </button>
            <button
              onClick={() => setCurrentSchema("v2")}
              className={`px-4 py-2 rounded ${
                currentSchema === "v2"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Schema V2
            </button>
            <button
              onClick={() => setCurrentSchema("v3")}
              className={`px-4 py-2 rounded ${
                currentSchema === "v3"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Schema V3
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            현재 선택된 스키마: <strong>{getCurrentSchemaName()}</strong>
          </p>
        </div>

        {/* 현재 스키마로 검증된 데이터 */}
        {currentValidatedData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              현재 스키마 검증 결과
            </h2>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-medium text-green-800 mb-2">
                ✅ {getCurrentSchemaName()}
              </h3>
              <pre className="text-sm text-green-700 overflow-x-auto">
                {JSON.stringify(currentValidatedData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 호환성 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">호환성 테스트 결과</h2>
            <div className="space-y-4">
              {testResults.map((result) => (
                <div
                  key={result.version}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                  data-testid={`result-${result.version}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {result.success ? "✅" : "❌"} Schema{" "}
                      {result.version.toUpperCase()}
                    </h3>
                    {result.migrationApplied && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        마이그레이션 적용됨
                      </span>
                    )}
                  </div>

                  {result.success ? (
                    <div>
                      <p className="text-green-700 text-sm mb-2">검증 성공</p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-green-600 hover:text-green-800">
                          검증된 데이터 보기
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded border text-gray-700 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-700 text-sm">검증 실패</p>
                      <p className="text-red-600 text-xs mt-1">
                        {result.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 호환성 요약 */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">호환성 요약</h3>
              <div className="text-sm text-blue-700">
                <p>
                  성공한 스키마: {testResults.filter((r) => r.success).length}/
                  {testResults.length}
                </p>
                <p className="mt-1">
                  {testResults.filter((r) => r.success).length ===
                  testResults.length
                    ? "🎉 모든 스키마 버전이 호환됩니다!"
                    : "⚠️ 일부 스키마에서 호환성 문제가 발견되었습니다."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 레거시 사용자 데이터 */}
        {legacyUser && (
          <div
            className="bg-white rounded-lg shadow-md p-6 mt-6"
            data-testid="legacy-user-data"
          >
            <h2 className="text-xl font-semibold mb-4">레거시 사용자 데이터</h2>
            <div className="space-y-2">
              <p>
                <strong>이름:</strong>{" "}
                <span data-testid="legacy-user-name">{legacyUser.name}</span>
              </p>
              <p>
                <strong>이메일:</strong> {legacyUser.email}
              </p>
              <p>
                <strong>전화번호:</strong>{" "}
                <span data-testid="legacy-user-phone">
                  {legacyUser.phone || "N/A"}
                </span>
              </p>
              {legacyUser.avatar && (
                <div data-testid="legacy-user-avatar">
                  아바타: {legacyUser.avatar}
                </div>
              )}
              <p>
                <strong>검증 상태:</strong>{" "}
                <span data-testid="legacy-validation-status">✅ Valid</span>
              </p>
            </div>
            <div className="mt-4 text-sm" data-testid="compatibility-info">
              Backward compatible: 기존 필드들은 모두 유지되며, 새로운 선택적
              필드들은 기본값으로 처리됩니다.
            </div>
          </div>
        )}

        {/* 모던 사용자 데이터 */}
        {modernUser && (
          <div
            className="bg-white rounded-lg shadow-md p-6 mt-6"
            data-testid="modern-user-data"
          >
            <h2 className="text-xl font-semibold mb-4">모던 사용자 데이터</h2>
            <div className="space-y-2">
              <p>
                <strong>이름:</strong>{" "}
                <span data-testid="modern-user-name">{modernUser.name}</span>
              </p>
              <p>
                <strong>이메일:</strong> {modernUser.email}
              </p>
              <p>
                <strong>전화번호:</strong>{" "}
                <span data-testid="modern-user-phone">{modernUser.phone}</span>
              </p>
              {modernUser.avatar && (
                <div data-testid="modern-user-avatar">
                  아바타: {modernUser.avatar}
                </div>
              )}
              {modernUser.preferences && (
                <div>
                  <strong>테마:</strong>{" "}
                  <span data-testid="modern-user-theme">
                    {modernUser.preferences.theme}
                  </span>
                </div>
              )}
              <p>
                <strong>검증 상태:</strong>{" "}
                <span data-testid="modern-validation-status">✅ Valid</span>
              </p>
            </div>
          </div>
        )}

        {/* Raw 데이터 표시 */}
        {rawData && (
          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">원본 API 데이터</h2>
            <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
