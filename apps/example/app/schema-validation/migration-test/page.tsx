"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { z } from "zod/v4";
import { FetchError } from "next-unified-query";

// 레거시 스키마 (구 버전)
const LegacyUserSchema = z.object({
  user_id: z.number(),
  user_name: z.string(),
  user_email: z.string(),
  user_created: z.string(),
});

// 현재 스키마 (신 버전)
const CurrentUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  profile: z
    .object({
      bio: z.string().optional(),
      avatar: z.string().url().optional(),
    })
    .optional(),
});

// 마이그레이션 함수
const migrateUserData = (legacyData: any) => {
  return {
    id: legacyData.user_id,
    name: legacyData.user_name,
    email: legacyData.user_email,
    createdAt: legacyData.user_created,
    profile: {
      bio: legacyData.bio || undefined,
      avatar:
        legacyData.avatar && legacyData.avatar.startsWith("http")
          ? legacyData.avatar
          : undefined,
    },
  };
};

type LegacyUser = z.infer<typeof LegacyUserSchema>;
type CurrentUser = z.infer<typeof CurrentUserSchema>;

interface MigrationStep {
  step: number;
  description: string;
  status: "pending" | "running" | "success" | "error";
  data?: any;
  error?: string;
}

export default function MigrationTestPage() {
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    { step: 1, description: "레거시 데이터 로드", status: "pending" },
    { step: 2, description: "레거시 스키마 검증", status: "pending" },
    { step: 3, description: "데이터 마이그레이션 실행", status: "pending" },
    { step: 4, description: "현재 스키마 검증", status: "pending" },
    { step: 5, description: "마이그레이션 완료", status: "pending" },
  ]);

  const [legacyData, setLegacyData] = useState<any>(null);
  const [migratedData, setMigratedData] = useState<CurrentUser | null>(null);

  // 레거시 데이터 로드
  const { refetch: loadLegacyData } = useQuery<any, FetchError>({
    cacheKey: ["legacy-data"],
    enabled: false,
    queryFn: async () => {
      const response = await fetch("/api/migration-test/legacy");
      if (!response.ok) {
        throw new Error("Failed to load legacy data");
      }
      return response.json();
    },
  });

  const updateStepStatus = (
    step: number,
    status: MigrationStep["status"],
    data?: any,
    error?: string
  ) => {
    setMigrationSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, status, data, error } : s))
    );
  };

  const executeMigration = async () => {
    try {
      // Step 1: Load legacy data
      updateStepStatus(1, "running");
      const response = await fetch("/api/migration-test/legacy");
      if (!response.ok) {
        throw new Error("Failed to load legacy data");
      }
      const rawLegacyData = await response.json();
      setLegacyData(rawLegacyData);
      updateStepStatus(1, "success", rawLegacyData);

      // Step 2: Validate legacy schema
      updateStepStatus(2, "running");
      try {
        const validatedLegacyData = LegacyUserSchema.parse(rawLegacyData);
        updateStepStatus(2, "success", validatedLegacyData);

        // Step 3: Execute migration
        updateStepStatus(3, "running");
        const migratedData = migrateUserData(validatedLegacyData);
        updateStepStatus(3, "success", migratedData);

        // Step 4: Validate current schema
        updateStepStatus(4, "running");
        try {
          const validatedCurrentData = CurrentUserSchema.parse(migratedData);
          setMigratedData(validatedCurrentData);
          updateStepStatus(4, "success", validatedCurrentData);

          // Step 5: Complete
          updateStepStatus(5, "success");
        } catch (error) {
          updateStepStatus(
            4,
            "error",
            null,
            error instanceof Error ? error.message : "Schema validation failed"
          );
        }
      } catch (error) {
        updateStepStatus(
          2,
          "error",
          null,
          error instanceof Error
            ? error.message
            : "Legacy schema validation failed"
        );
      }
    } catch (error) {
      updateStepStatus(
        1,
        "error",
        null,
        error instanceof Error ? error.message : "Failed to load data"
      );
    }
  };

  const resetMigration = () => {
    setMigrationSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "pending",
        data: undefined,
        error: undefined,
      }))
    );
    setLegacyData(null);
    setMigratedData(null);
  };

  const getStepIcon = (status: MigrationStep["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  const getStepColor = (status: MigrationStep["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-200 bg-gray-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">스키마 마이그레이션 테스트</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">마이그레이션 시나리오</h2>
          <div className="space-y-2 text-gray-600 mb-4">
            <p>
              • <strong>레거시 스키마:</strong> user_id, user_name, user_email,
              user_created
            </p>
            <p>
              • <strong>현재 스키마:</strong> id, name, email, createdAt,
              profile
            </p>
            <p>• 필드명 변경 및 구조 개선을 위한 데이터 마이그레이션</p>
            <p>• 마이그레이션 과정에서 데이터 무결성 검증</p>
          </div>

          <div className="space-x-4">
            <button
              data-testid="start-migration-btn"
              onClick={executeMigration}
              disabled={migrationSteps.some((s) => s.status === "running")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {migrationSteps.some((s) => s.status === "running")
                ? "마이그레이션 진행 중..."
                : "마이그레이션 시작"}
            </button>

            <button
              data-testid="reset-migration-btn"
              onClick={resetMigration}
              disabled={migrationSteps.some((s) => s.status === "running")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 마이그레이션 단계 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">마이그레이션 진행 상황</h2>
          <div className="space-y-4">
            {migrationSteps.map((step) => (
              <div
                key={step.step}
                className={`border rounded-lg p-4 ${getStepColor(step.status)}`}
                data-testid={`migration-step-${step.step}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStepIcon(step.status)}</span>
                    <div>
                      <h3 className="font-medium">
                        Step {step.step}: {step.description}
                      </h3>
                      {step.status === "running" && (
                        <p className="text-sm text-blue-600">실행 중...</p>
                      )}
                      {step.error && (
                        <p className="text-sm text-red-600">
                          오류: {step.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {step.data && step.status === "success" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      데이터 보기
                    </summary>
                    <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-x-auto">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 마이그레이션 결과 비교 */}
        {legacyData && migratedData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* 레거시 데이터 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-600">
                레거시 데이터
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>user_id:</strong> {legacyData.user_id}
                </p>
                <p>
                  <strong>user_name:</strong> {legacyData.user_name}
                </p>
                <p>
                  <strong>user_email:</strong> {legacyData.user_email}
                </p>
                <p>
                  <strong>user_created:</strong> {legacyData.user_created}
                </p>
              </div>
              <div className="mt-4 text-xs text-gray-500">원본 레거시 형식</div>
            </div>

            {/* 마이그레이션된 데이터 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600">
                마이그레이션된 데이터
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>id:</strong> {migratedData.id}
                </p>
                <p>
                  <strong>name:</strong> {migratedData.name}
                </p>
                <p>
                  <strong>email:</strong> {migratedData.email}
                </p>
                <p>
                  <strong>createdAt:</strong> {migratedData.createdAt}
                </p>
                {migratedData.profile && (
                  <div className="ml-4">
                    <p>
                      <strong>profile:</strong>
                    </p>
                    <p className="ml-4">
                      <strong>bio:</strong>{" "}
                      {migratedData.profile.bio || "(empty)"}
                    </p>
                    <p className="ml-4">
                      <strong>avatar:</strong>{" "}
                      {migratedData.profile.avatar || "(empty)"}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-xs text-gray-500">현재 스키마 형식</div>
            </div>
          </div>
        )}

        {/* 마이그레이션 완료 메시지 */}
        {migrationSteps.every((s) => s.status === "success") && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🎉 마이그레이션 완료!
            </h3>
            <p className="text-green-700">
              레거시 데이터가 성공적으로 현재 스키마 형식으로
              마이그레이션되었습니다.
            </p>
            <div className="mt-4 text-sm text-green-600">
              <p>✅ 모든 필드가 정상적으로 변환됨</p>
              <p>✅ 데이터 무결성 검증 통과</p>
              <p>✅ 새로운 스키마 검증 성공</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
