"use client";

import { useMutation } from "../../lib/query-client";
import { useState } from "react";
import { z } from "zod";

// 요청 스키마
const CreateUserRequestSchema = z.object({
  name: z.string().min(2, "이름은 최소 2글자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  age: z
    .number()
    .min(1, "나이는 1살 이상이어야 합니다")
    .max(120, "나이는 120살 이하여야 합니다"),
  role: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "역할은 user 또는 admin이어야 합니다" }),
  }),
});

// 응답 스키마
const CreateUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
  role: z.enum(["user", "admin"]),
  createdAt: z.string().datetime(),
  status: z.literal("success"),
});

type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

export default function CreateUserPage() {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: "",
    email: "",
    age: 25,
    role: "user",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const createUserMutation = useMutation<
    CreateUserResponse,
    any,
    CreateUserRequest
  >({
    mutationFn: async (userData, fetcher) => {
      // 요청 전 스키마 검증
      console.log("🔍 Original userData:", userData, typeof userData.age);
      try {
        const validatedRequest = CreateUserRequestSchema.parse(userData);
        console.log("✅ Request validation passed:", validatedRequest);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("❌ Request validation failed:", error.errors);
          throw new Error(
            `요청 데이터 검증 실패: ${error.errors
              .map((e) => e.message)
              .join(", ")}`
          );
        }
        throw error;
      }

      // 내장 fetcher 사용
      const response = await fetcher.post("/api/users", {
        data: userData,
      });

      // HTTP 상태가 성공인 경우에만 응답 스키마 검증
      if (response.status >= 200 && response.status < 300) {
        try {
          const validatedResponse = CreateUserResponseSchema.parse(response.data);
          console.log("✅ Response validation passed:", validatedResponse);
          return validatedResponse;
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error("❌ Response validation failed:", error.errors);
            throw new Error(
              `응답 데이터 검증 실패: ${error.errors
                .map((e) => e.message)
                .join(", ")}`
            );
          }
          throw error;
        }
      } else {
        // HTTP 오류인 경우 응답 데이터를 그대로 에러로 던짐
        console.error("❌ HTTP Error:", response.status, response.data);
        throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      console.log("🎉 사용자 생성 성공:", data);
      setFormData({ name: "", email: "", age: 25, role: "user" });
      setValidationErrors({});
    },
    onError: (error) => {
      console.error("❌ 사용자 생성 실패:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // 클라이언트 측 검증
    try {
      CreateUserRequestSchema.parse(formData);
      createUserMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "age" ? Number(value) : value,
    }));

    // 해당 필드의 검증 오류 제거
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="create-user-form"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Zod 스키마 검증을 통한 사용자 생성
          </h1>

          {/* 스키마 검증 설명 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">
              🛡️ 이중 스키마 검증
            </h3>
            <p className="text-blue-700 text-sm">
              요청 데이터와 응답 데이터 모두 Zod 스키마로 검증됩니다. 콘솔에서
              검증 과정을 확인할 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* 이름 입력 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이름 *
              </label>
              <input
                type="text"
                id="name"
                data-testid="user-name-input"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="홍길동"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일 *
              </label>
              <input
                type="text"
                id="email"
                data-testid="user-email-input"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="hong@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* 나이 입력 */}
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                나이 *
              </label>
              <input
                type="number"
                id="age"
                data-testid="user-age-input"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.age ? "border-red-500" : "border-gray-300"
                }`}
                min="1"
                max="120"
              />
              {validationErrors.age && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.age}
                </p>
              )}
            </div>

            {/* 역할 선택 */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                역할 *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  handleInputChange("role", e.target.value as "user" | "admin")
                }
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="user">일반 사용자</option>
                <option value="admin">관리자</option>
              </select>
              {validationErrors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.role}
                </p>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              data-testid="create-user-btn"
              disabled={createUserMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createUserMutation.isPending ? "생성 중..." : "사용자 생성"}
            </button>
          </form>

          {/* 성공 메시지 */}
          {createUserMutation.isSuccess && createUserMutation.data && (
            <div
              className="mt-6 bg-green-50 border border-green-200 p-4 rounded-lg"
              data-testid="creation-success"
            >
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ 사용자 생성 성공!
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  <strong>ID:</strong> {createUserMutation.data.id}
                </p>
                <p>
                  <strong>이름:</strong> <span data-testid="created-user-name">{createUserMutation.data.name}</span>
                </p>
                <p>
                  <strong>이메일:</strong> {createUserMutation.data.email}
                </p>
                <p>
                  <strong>나이:</strong> {createUserMutation.data.age}세
                </p>
                <p>
                  <strong>역할:</strong> {createUserMutation.data.role}
                </p>
                <p>
                  <strong>생성일:</strong>{" "}
                  {new Date(createUserMutation.data.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* 클라이언트 검증 오류 메시지 */}
          {Object.keys(validationErrors).length > 0 && (
            <div
              className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg"
              data-testid="validation-errors"
            >
              <h3 className="font-semibold text-red-800 mb-2">
                ❌ 입력 오류
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field} data-testid="validation-error">
                    <strong>{field}:</strong> {message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 서버 오류 메시지 */}
          {createUserMutation.isError && (
            <div
              className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg"
              data-testid="error-message"
            >
              <h3 className="font-semibold text-red-800 mb-2">
                ❌ 사용자 생성 실패
              </h3>
              <p className="text-sm text-red-700">
                {createUserMutation.error?.message ||
                  "알 수 없는 오류가 발생했습니다."}
              </p>
            </div>
          )}

          {/* 스키마 정보 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">📋 Zod 스키마 정의</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  📤 요청 스키마
                </h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`const CreateUserRequestSchema = z.object({
  name: z.string().min(2, "최소 2글자"),
  email: z.string().email("올바른 이메일"),
  age: z.number().min(1).max(120),
  role: z.enum(["user", "admin"])
});`}
                </pre>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  📥 응답 스키마
                </h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {`const CreateUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
  role: z.enum(["user", "admin"]),
  createdAt: z.string().datetime(),
  status: z.literal("success")
});`}
                </pre>
              </div>
            </div>

            {/* 검증 과정 설명 */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3">🔍 검증 과정</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>
                  <strong>1. 클라이언트 검증:</strong> 폼 제출 시 요청 스키마로
                  사전 검증
                </p>
                <p>
                  <strong>2. 서버 요청 검증:</strong> API 호출 전 다시 한번 검증
                </p>
                <p>
                  <strong>3. 서버 응답 검증:</strong> 받은 응답 데이터 스키마
                  검증
                </p>
                <p>
                  <strong>4. 타입 안전성:</strong> TypeScript와 Zod가 함께 타입
                  안전성 보장
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
