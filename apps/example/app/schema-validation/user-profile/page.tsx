"use client";

import { useQuery } from "../../lib/query-client";
import { z } from "next-unified-query";

// Zod 스키마 정의 (전체 프로필 스키마)
const UserProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive(),
  profile: z.object({
    bio: z.string(),
    avatar: z.string().url(),
    socialLinks: z.object({
      github: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    }),
  }),
  preferences: z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
    language: z.string(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type UserProfile = z.infer<typeof UserProfileSchema>;

export default function UserProfileValidation() {
  const { data, error, isLoading } = useQuery<UserProfile>({
    cacheKey: ["users", 1],
    queryFn: async () => {
      const response = await fetch("/api/users/1");
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const rawData = await response.json();

      try {
        // Zod 스키마 검증
        const validatedData = UserProfileSchema.parse(rawData);

        // 검증 성공 시 글로벌 상태에 저장
        (window as any).__SCHEMA_VALIDATION_STATUS__ = "valid";
        (window as any).__SCHEMA_VALIDATION_ERRORS__ = [];

        return validatedData;
      } catch (validationError) {
        // 검증 실패 시 상세 오류 정보 저장
        (window as any).__SCHEMA_VALIDATION_STATUS__ = "invalid";
        if (validationError instanceof z.ZodError) {
          (window as any).__SCHEMA_VALIDATION_ERRORS__ =
            validationError.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
              code: err.code,
              timestamp: new Date().toISOString(),
              endpoint: "/api/users/1",
            }));
        }
        throw validationError;
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
    const isSchemaError = error instanceof z.ZodError;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6"
            data-testid="schema-validation-error"
          >
            <h1 className="text-xl font-bold text-red-900 mb-4">
              스키마 검증 오류
            </h1>

            <div className="mb-4">
              <span
                className="text-lg font-medium"
                data-testid="schema-validation-status"
              >
                ❌ Invalid
              </span>
            </div>

            {isSchemaError && (
              <div data-testid="validation-errors">
                <h3 className="font-medium text-red-800 mb-2">
                  상세 오류 목록:
                </h3>
                <ul className="space-y-1">
                  {(error as z.ZodError).issues.map((err, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-700"
                      data-testid="validation-error-item"
                    >
                      {err.path.join(".")} : {err.message} (code: {err.code})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="mt-4 p-3 bg-red-100 rounded"
              data-testid="user-friendly-error"
            >
              서버에서 올바르지 않은 데이터를 받았습니다. 관리자에게 문의하세요.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="user-profile-valid"
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                사용자 프로필
              </h1>
              <span
                className="text-lg font-medium text-green-600"
                data-testid="schema-validation-status"
              >
                ✅ Valid
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  이름
                </label>
                <p className="text-lg text-gray-900" data-testid="user-name">
                  {data.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  이메일
                </label>
                <p className="text-lg text-gray-900" data-testid="user-email">
                  {data.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  나이
                </label>
                <p className="text-lg text-gray-900" data-testid="user-age">
                  {data.age}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">프로필 정보</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      소개
                    </label>
                    <p className="text-gray-900" data-testid="user-bio">
                      {data.profile.bio}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      아바타
                    </label>
                    <p className="text-gray-900 text-sm" data-testid="user-avatar">
                      {data.profile.avatar}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">환경설정</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      테마
                    </label>
                    <p className="text-gray-900" data-testid="user-theme">
                      {data.preferences.theme}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      알림
                    </label>
                    <p className="text-gray-900" data-testid="user-notifications">
                      {data.preferences.notifications ? "켜짐" : "꺼짐"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      언어
                    </label>
                    <p className="text-gray-900" data-testid="user-language">
                      {data.preferences.language}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">날짜 정보</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      생성일
                    </label>
                    <p className="text-gray-900" data-testid="created-date">
                      {new Date(data.createdAt).toISOString().split('T')[0]}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      수정일
                    </label>
                    <p className="text-gray-900" data-testid="updated-date">
                      {new Date(data.updatedAt).toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">
                스키마 검증 정보
              </h3>
              <p className="text-sm text-gray-600">
                모든 필드가 정의된 Zod 스키마를 통과했습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
