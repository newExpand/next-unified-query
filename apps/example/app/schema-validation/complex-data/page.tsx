"use client";

import { useQuery } from "../../lib/query-client";
import { z } from "next-unified-query";

// Zod 스키마 정의
const ComplexDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string().datetime(),
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
  stats: z.object({
    posts: z.number(),
    views: z.number(),
    likes: z.number(),
  }),
  skills: z.array(z.string()),
  tags: z.array(z.string()),
  metadata: z.object({
    version: z.string(),
    lastLogin: z.string().datetime(),
  }),
});

type ComplexData = z.infer<typeof ComplexDataSchema>;

export default function ComplexDataPage() {
  const { data, error, isLoading, refetch } = useQuery<ComplexData, any>({
    cacheKey: ["complex-data"],
    queryFn: async (fetcher) => {
      // 내장 fetcher 사용
      const response = await fetcher.get("/api/complex-data");

      try {
        // 스키마 검증
        const validatedData = ComplexDataSchema.parse(response.data);
        return validatedData;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("Schema validation failed:", validationError.issues);
          // 검증 오류를 던져서 error 상태로 처리
          throw validationError;
        }
        throw validationError;
      }
    },
  });

  const isSchemaError = error instanceof z.ZodError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>복잡한 데이터 검증 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-6"
            data-testid="schema-validation-error"
          >
            <h1 className="text-xl font-bold text-red-900 mb-4">
              스키마 검증 오류
            </h1>
            <div
              className="text-red-700 mb-4"
              data-testid="validation-errors"
            >
              {isSchemaError
                ? `스키마 검증 실패: ${(error as z.ZodError).issues
                    .map((e) => e.path.join("."))
                    .join(", ")}`
                : "서버에서 올바르지 않은 데이터를 받았습니다."}
            </div>
            <button
              onClick={() => refetch()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="complex-data"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Zod 스키마 검증 (복잡한 중첩 데이터)
            </h1>

            {/* 검증 성공 알림 */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ 스키마 검증 성공
              </h3>
              <p className="text-green-700 text-sm">
                복잡한 중첩 구조의 데이터가 Zod 스키마를 통해 성공적으로
                검증되었습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 기본 정보 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">기본 정보</h3>
                <p>
                  <strong>이름:</strong> {data.name}
                </p>
                <p>
                  <strong>ID:</strong> {data.id}
                </p>
                <p>
                  <strong>생성일:</strong>{" "}
                  {new Date(data.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* 프로필 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">프로필</h3>
                <p>
                  <strong>소개:</strong> {data.profile.bio}
                </p>
                <p>
                  <strong>테마:</strong> {data.preferences.theme}
                </p>
                <p>
                  <strong>언어:</strong> {data.preferences.language}
                </p>
              </div>

              {/* 통계 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">통계</h3>
                <p>
                  <strong>게시물:</strong> {data.stats.posts}
                </p>
                <p>
                  <strong>조회수:</strong> {data.stats.views.toLocaleString()}
                </p>
                <p>
                  <strong>좋아요:</strong> {data.stats.likes}
                </p>
              </div>

              {/* 스킬 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">스킬</h3>
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* 태그 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">태그</h3>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 메타데이터 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">메타데이터</h3>
                <p>
                  <strong>버전:</strong> {data.metadata.version}
                </p>
                <p>
                  <strong>마지막 로그인:</strong>{" "}
                  {new Date(data.metadata.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* 스키마 정보 */}
            <div className="mt-8 border-t pt-6">
              <h4 className="font-semibold mb-4">📋 Zod 스키마 구조</h4>
              <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {`const ComplexDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string().datetime(),
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
  stats: z.object({
    posts: z.number(),
    views: z.number(),
    likes: z.number(),
  }),
  skills: z.array(z.string()),
  tags: z.array(z.string()),
  metadata: z.object({
    version: z.string(),
    lastLogin: z.string().datetime(),
  }),
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
