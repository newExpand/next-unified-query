"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError, z } from "next-unified-query";

// 사용자 기본 정보 스키마 (안전한 부분)
const UserBasicSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 프로필 스키마 (선택적, 실패할 수 있는 부분)
const UserProfileSchema = z
  .object({
    bio: z.string(),
    avatar: z.string().url(),
  })
  .optional();

// 설정 스키마 (선택적, 실패할 수 있는 부분)
const UserPreferencesSchema = z
  .object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
    language: z.string(),
  })
  .optional();

type UserBasic = z.infer<typeof UserBasicSchema>;
type UserProfile = z.infer<typeof UserProfileSchema>;
type UserPreferences = z.infer<typeof UserPreferencesSchema>;

type UserData = {
  basic: UserBasic;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  validationErrors: string[];
};

export default function PartialFallbackValidation() {
  const [showDevMode, setShowDevMode] = useState(false);

  const { data, error, isLoading } = useQuery<UserData, FetchError>({
    cacheKey: ["users", "partial-fallback"],
    queryFn: async () => {
      const response = await fetch("/api/users/1?mode=partial");
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const rawData = await response.json();
      const errors: string[] = [];

      try {
        // 기본 정보 검증 (필수)
        const basicData = UserBasicSchema.parse({
          id: rawData.id,
          name: rawData.name,
          email: rawData.email,
          age: rawData.age,
          createdAt: rawData.createdAt,
          updatedAt: rawData.updatedAt,
        });

        // 프로필 검증 (선택적)
        let profileData: UserProfile | null = null;
        try {
          if (rawData.profile) {
            profileData = UserProfileSchema.parse(rawData.profile);
          }
        } catch (_err) {
          errors.push("profile: 프로필 데이터가 올바르지 않습니다");
        }

        // 설정 검증 (선택적)
        let preferencesData: UserPreferences | null = null;
        try {
          if (rawData.preferences) {
            preferencesData = UserPreferencesSchema.parse(rawData.preferences);
          }
        } catch (_err) {
          errors.push("preferences: 설정 데이터가 올바르지 않습니다");
        }

        // 글로벌 상태에 검증 결과 저장
        (window as any).__PARTIAL_VALIDATION_ERRORS__ = errors;
        (window as any).__SCHEMA_VALIDATION_MODE__ = "partial";

        return {
          basic: basicData,
          profile: profileData,
          preferences: preferencesData,
          validationErrors: errors,
        };
      } catch (_basicError) {
        throw new Error("기본 사용자 정보가 올바르지 않습니다");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-4">
              데이터 로드 실패
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 기본 정보 (항상 표시) */}
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="user-basic-info"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              사용자 기본 정보
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  이름
                </label>
                <p className="text-lg text-gray-900" data-testid="user-name">
                  {data.basic.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  이메일
                </label>
                <p className="text-lg text-gray-900" data-testid="user-email">
                  {data.basic.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  나이
                </label>
                <p className="text-lg text-gray-900" data-testid="user-age">
                  {data.basic.age}
                </p>
              </div>
            </div>
          </div>

          {/* 프로필 섹션 (검증 성공 시만 표시) */}
          {data.profile ? (
            <div
              className="bg-white shadow rounded-lg p-6"
              data-testid="profile-section"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">프로필</h2>
              <div className="space-y-2">
                <p>
                  <strong>소개:</strong> {data.profile.bio}
                </p>
                <p>
                  <strong>아바타:</strong> {data.profile.avatar}
                </p>
              </div>
            </div>
          ) : null}

          {/* 설정 섹션 (검증 성공 시만 표시) */}
          {data.preferences ? (
            <div
              className="bg-white shadow rounded-lg p-6"
              data-testid="preferences-section"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">설정</h2>
              <div className="space-y-2">
                <p>
                  <strong>테마:</strong> {data.preferences.theme}
                </p>
                <p>
                  <strong>알림:</strong>{" "}
                  {data.preferences.notifications ? "활성화" : "비활성화"}
                </p>
                <p>
                  <strong>언어:</strong> {data.preferences.language}
                </p>
              </div>
            </div>
          ) : null}

          {/* 부분적 오류 경고 */}
          {data.validationErrors.length > 0 && (
            <div
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
              data-testid="partial-error-warning"
            >
              일부 정보를 불러오는데 문제가 있었습니다.
            </div>
          )}

          {/* 개발자 모드 토글 */}
          <div className="bg-white shadow rounded-lg p-6">
            <button
              onClick={() => setShowDevMode(!showDevMode)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              data-testid="toggle-dev-mode"
            >
              개발자 모드 {showDevMode ? "숨기기" : "보기"}
            </button>

            {showDevMode && (
              <div
                className="mt-4 p-4 bg-gray-100 rounded"
                data-testid="dev-error-details"
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  검증 오류 상세
                </h3>
                {data.validationErrors.length > 0 ? (
                  <ul className="space-y-1">
                    {data.validationErrors.map((error, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-600"
                        data-testid="dev-error-item"
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-600">모든 검증 통과</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
