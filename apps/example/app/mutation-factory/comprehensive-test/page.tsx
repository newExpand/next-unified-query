"use client";

import { useState } from "react";
import { useMutation, createMutationFactory, z } from "../../lib/query-client";

// Zod 스키마 정의
const userCreateSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  age: z.number().min(0, "나이는 0 이상이어야 합니다").optional(),
});

const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  createdAt: z.string(),
});

const userUpdateSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).optional(),
});

// Factory를 사용한 mutation 정의
const userMutations = createMutationFactory({
  // URL + Method 방식 - 사용자 생성
  createUser: {
    cacheKey: ["users", "create"],
    url: "/api/users",
    method: "POST" as const,
    requestSchema: userCreateSchema,
    responseSchema: userResponseSchema,
    invalidateQueries: [["users"]],
    onSuccess: (data, variables) => {
      console.log("사용자 생성 성공:", data, variables);
    },
  },

  // URL + Method 방식 - 동적 URL로 사용자 수정
  updateUser: {
    cacheKey: ["users", "update"],
    url: (variables: {
      id: number;
      name?: string;
      email?: string;
      age?: number;
    }) => `/api/users/${variables.id}`,
    method: "PUT" as const,
    requestSchema: userUpdateSchema,
    responseSchema: userResponseSchema,
    invalidateQueries: (data, variables) => [
      ["users"],
      ["users", variables.id],
    ],
    onSuccess: (data, variables) => {
      console.log("사용자 수정 성공:", data, variables);
    },
  },

  // URL + Method 방식 - 사용자 삭제
  deleteUser: {
    cacheKey: ["users", "delete"],
    url: (variables: { id: number }) => `/api/users/${variables.id}`,
    method: "DELETE" as const,
    onSuccess: (data, variables) => {
      console.log(`사용자 ${variables.id} 삭제 완료`);
    },
    invalidateQueries: [["users"]],
  },

  // Custom Function 방식 - 복잡한 사용자 생성 (프로필 포함)
  createUserWithProfile: {
    cacheKey: ["users", "create-with-profile"],
    mutationFn: async (
      variables: {
        userData: { name: string; email: string; age?: number };
        profileData: { bio: string; avatar?: string };
      },
      fetcher
    ) => {
      // 1단계: 사용자 생성
      const userResult = await fetcher.request({
        url: "/api/users",
        method: "POST",
        data: variables.userData,
        schema: userResponseSchema,
      });

      // 2단계: 프로필 생성 (실제로는 별도 API 호출)
      // 여기서는 단순화를 위해 기존 사용자 데이터에 프로필 정보 추가
      await new Promise((resolve) => setTimeout(resolve, 500)); // 시뮬레이션

      const combinedResult = {
        user: userResult.data,
        profile: {
          id: (userResult.data as any).id,
          bio: variables.profileData.bio,
          avatar: variables.profileData.avatar || null,
        },
      };

      return combinedResult;
    },
    responseSchema: z.object({
      user: userResponseSchema,
      profile: z.object({
        id: z.number(),
        bio: z.string(),
        avatar: z.string().nullable(),
      }),
    }),
    invalidateQueries: [["users"], ["profiles"]],
    onSuccess: (data, variables) => {
      console.log("사용자 및 프로필 생성 성공:", data);
    },
  },

  // Custom Function 방식 - 배치 업데이트
  batchUpdateUsers: {
    cacheKey: ["users", "batch-update"],
    mutationFn: async (
      userUpdates: Array<{
        id: number;
        updates: Partial<{ name: string; email: string; age: number }>;
      }>,
      fetcher
    ) => {
      const results = await Promise.allSettled(
        userUpdates.map(({ id, updates }) =>
          fetcher.request({
            url: `/api/users/${id}`,
            method: "PUT",
            data: { id, ...updates },
            schema: userResponseSchema,
          })
        )
      );

      const successful = results
        .map((result, index) => ({ result, original: userUpdates[index] }))
        .filter(({ result }) => result.status === "fulfilled")
        .map(({ result, original }) => ({
          id: original.id,
          data: (result as PromiseFulfilledResult<any>).value.data,
        }));

      const failed = results
        .map((result, index) => ({ result, original: userUpdates[index] }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ result, original }) => ({
          id: original.id,
          error: (result as PromiseRejectedResult).reason,
        }));

      return {
        successful,
        failed,
        total: userUpdates.length,
        successCount: successful.length,
        failureCount: failed.length,
      };
    },
    onError: (error, variables) => {
      console.error("배치 업데이트 에러:", error, variables);
    },
    onSuccess: (data, variables) => {
      console.log("배치 업데이트 완료:", data);
    },
  },

  // 타임아웃 테스트를 위한 느린 요청
  slowMutation: {
    cacheKey: ["slow", "mutation"],
    url: "/api/slow-mutation",
    method: "POST" as const,
    fetchConfig: {
      timeout: 5000, // 5초 타임아웃 설정
    },
    onError: (error, variables) => {
      console.error("느린 뮤테이션 에러:", error);
    },
    onSuccess: (data, variables) => {
      console.log("느린 뮤테이션 성공:", data);
    },
  },

  // 빠른 타임아웃 테스트
  fastTimeoutMutation: {
    cacheKey: ["fast", "timeout"],
    url: "/api/async-mutation",
    method: "POST" as const,
    fetchConfig: {
      timeout: 1000, // 1초 타임아웃 설정 (매우 짧음)
    },
    onError: (error, variables) => {
      console.error("빠른 타임아웃 에러:", error);
    },
    onSuccess: (data, variables) => {
      console.log("빠른 타임아웃 성공:", data);
    },
  },
});

type UserFormData = z.infer<typeof userCreateSchema>;
type UserUpdateData = z.infer<typeof userUpdateSchema>;

export default function MutationFactoryComprehensiveTestPage() {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    age: undefined,
  });

  const [updateData, setUpdateData] = useState<UserUpdateData>({
    id: 1,
    name: "",
    email: "",
    age: undefined,
  });

  const [profileData, setProfileData] = useState({
    userData: { name: "", email: "", age: undefined as number | undefined },
    profileData: { bio: "", avatar: "" },
  });

  // URL + Method 방식 mutations
  const createUserMutation = useMutation(userMutations.createUser);
  const updateUserMutation = useMutation(userMutations.updateUser);
  const deleteUserMutation = useMutation(userMutations.deleteUser);

  // Custom Function 방식 mutations
  const createUserWithProfileMutation = useMutation(
    userMutations.createUserWithProfile
  );
  const batchUpdateMutation = useMutation<{
    successful: Array<{ id: number; data: any }>;
    failed: Array<{ id: number; error: any }>;
    total: number;
    successCount: number;
    failureCount: number;
  }>(userMutations.batchUpdateUsers);

  // 타임아웃 테스트 mutations
  const slowMutation = useMutation(userMutations.slowMutation);
  const fastTimeoutMutation = useMutation(userMutations.fastTimeoutMutation);

  // Event handlers
  const handleCreateUser = () => {
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = () => {
    updateUserMutation.mutate(updateData);
  };

  const handleDeleteUser = () => {
    deleteUserMutation.mutate({ id: updateData.id });
  };

  const handleCreateUserWithProfile = () => {
    createUserWithProfileMutation.mutate(profileData);
  };

  const handleBatchUpdate = () => {
    const updates = [
      { id: 1, updates: { name: "Updated User 1" } },
      { id: 2, updates: { name: "Updated User 2", age: 30 } },
      { id: 999, updates: { name: "Non-existent User" } }, // 실패할 케이스
    ];
    batchUpdateMutation.mutate(updates);
  };

  const handleSchemaValidationError = () => {
    // 의도적으로 잘못된 데이터로 스키마 검증 실패를 유발
    createUserMutation.mutate({
      name: "", // 빈 문자열로 검증 실패
      email: "invalid-email", // 잘못된 이메일 형식
      age: -5, // 음수 나이
    } as any);
  };

  const handleSlowMutation = () => {
    slowMutation.mutate({ delay: 3000 });
  };

  const handleFastTimeoutMutation = () => {
    fastTimeoutMutation.mutate({ delay: 2000 });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        createMutationFactory 종합 테스트
      </h1>

      <div className="space-y-8">
        {/* Factory 정의 표시 섹션 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Factory 정의</h2>
          <div className="text-sm bg-gray-800 text-white p-4 rounded overflow-auto">
            <pre>{`const userMutations = createMutationFactory({
  // URL + Method 방식
  createUser: { url: "/api/users", method: "POST", ... },
  updateUser: { url: (vars) => \`/api/users/\${vars.id}\`, method: "PUT", ... },
  deleteUser: { url: (vars) => \`/api/users/\${vars.id}\`, method: "DELETE", ... },
  
  // Custom Function 방식
  createUserWithProfile: { 
    mutationFn: async (variables, fetcher) => { /* 복잡한 로직 */ } 
  },
  batchUpdateUsers: { 
    mutationFn: async (userUpdates, fetcher) => { /* 배치 처리 */ } 
  },
});`}</pre>
          </div>
        </div>

        {/* URL + Method 방식 테스트 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            URL + Method 방식 테스트
          </h2>

          {/* 사용자 생성 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">사용자 생성 (POST)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                data-testid="create-name-input"
                type="text"
                placeholder="이름"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                data-testid="create-email-input"
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                data-testid="create-age-input"
                type="number"
                placeholder="나이 (선택사항)"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-x-4">
              <button
                data-testid="create-user-btn"
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {createUserMutation.isPending ? "생성 중..." : "사용자 생성"}
              </button>
              <button
                data-testid="schema-error-btn"
                onClick={handleSchemaValidationError}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                스키마 검증 실패 테스트
              </button>
            </div>

            {/* 생성 결과 */}
            {createUserMutation.isSuccess && (
              <div
                data-testid="create-success"
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded"
              >
                <h4 className="font-semibold text-green-800">생성 성공!</h4>
                <pre className="text-sm mt-2 text-green-700">
                  {JSON.stringify(createUserMutation.data, null, 2)}
                </pre>
              </div>
            )}
            {createUserMutation.isError && (
              <div
                data-testid="create-error"
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded"
              >
                <h4 className="font-semibold text-red-800">생성 실패!</h4>
                <div className="text-sm mt-2 text-red-700">
                  {createUserMutation.error?.message || "알 수 없는 오류"}
                </div>
              </div>
            )}
          </div>

          {/* 사용자 수정 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">
              사용자 수정 (PUT - 동적 URL)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <input
                data-testid="update-id-input"
                type="number"
                placeholder="사용자 ID"
                value={updateData.id}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    id: parseInt(e.target.value) || 1,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                data-testid="update-name-input"
                type="text"
                placeholder="새 이름 (선택사항)"
                value={updateData.name || ""}
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                data-testid="update-email-input"
                type="email"
                placeholder="새 이메일 (선택사항)"
                value={updateData.email || ""}
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                data-testid="update-age-input"
                type="number"
                placeholder="새 나이 (선택사항)"
                value={updateData.age || ""}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    age: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-x-4">
              <button
                data-testid="update-user-btn"
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {updateUserMutation.isPending ? "수정 중..." : "사용자 수정"}
              </button>
              <button
                data-testid="delete-user-btn"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
              >
                {deleteUserMutation.isPending ? "삭제 중..." : "사용자 삭제"}
              </button>
            </div>

            {/* 수정 결과 */}
            {updateUserMutation.isSuccess && (
              <div
                data-testid="update-success"
                className="mt-4 p-4 bg-green-50 border border-green-200 rounded"
              >
                <h4 className="font-semibold text-green-800">수정 성공!</h4>
                <pre className="text-sm mt-2 text-green-700">
                  {JSON.stringify(updateUserMutation.data, null, 2)}
                </pre>
              </div>
            )}
            {updateUserMutation.isError && (
              <div
                data-testid="update-error"
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded"
              >
                <h4 className="font-semibold text-red-800">수정 실패!</h4>
                <div className="text-sm mt-2 text-red-700">
                  {updateUserMutation.error?.message || "알 수 없는 오류"}
                </div>
              </div>
            )}

            {/* 삭제 결과 */}
            {deleteUserMutation.isSuccess && (
              <div
                data-testid="delete-success"
                className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded"
              >
                <h4 className="font-semibold text-yellow-800">삭제 성공!</h4>
                <pre className="text-sm mt-2 text-yellow-700">
                  {JSON.stringify(deleteUserMutation.data, null, 2)}
                </pre>
              </div>
            )}
            {deleteUserMutation.isError && (
              <div
                data-testid="delete-error"
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded"
              >
                <h4 className="font-semibold text-red-800">삭제 실패!</h4>
                <div className="text-sm mt-2 text-red-700">
                  {deleteUserMutation.error?.message || "알 수 없는 오류"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Function 방식 테스트 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Custom Function 방식 테스트
          </h2>

          {/* 복합 사용자 생성 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">
              사용자 + 프로필 생성 (다단계 프로세스)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <h4 className="font-medium mb-2">사용자 정보</h4>
                <div className="space-y-2">
                  <input
                    data-testid="profile-name-input"
                    type="text"
                    placeholder="이름"
                    value={profileData.userData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        userData: { ...prev.userData, name: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    data-testid="profile-email-input"
                    type="email"
                    placeholder="이메일"
                    value={profileData.userData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        userData: { ...prev.userData, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    data-testid="profile-age-input"
                    type="number"
                    placeholder="나이"
                    value={profileData.userData.age || ""}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        userData: {
                          ...prev.userData,
                          age: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">프로필 정보</h4>
                <div className="space-y-2">
                  <textarea
                    data-testid="profile-bio-input"
                    placeholder="자기소개"
                    value={profileData.profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        profileData: {
                          ...prev.profileData,
                          bio: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-20"
                  />
                  <input
                    data-testid="profile-avatar-input"
                    type="text"
                    placeholder="아바타 URL (선택사항)"
                    value={profileData.profileData.avatar}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        profileData: {
                          ...prev.profileData,
                          avatar: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            <button
              data-testid="create-user-profile-btn"
              onClick={handleCreateUserWithProfile}
              disabled={createUserWithProfileMutation.isPending}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
            >
              {createUserWithProfileMutation.isPending
                ? "생성 중..."
                : "사용자 + 프로필 생성"}
            </button>

            {/* 복합 생성 결과 */}
            {createUserWithProfileMutation.isSuccess && (
              <div
                data-testid="profile-success"
                className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded"
              >
                <h4 className="font-semibold text-purple-800">
                  복합 생성 성공!
                </h4>
                <pre className="text-sm mt-2 text-purple-700">
                  {JSON.stringify(createUserWithProfileMutation.data, null, 2)}
                </pre>
              </div>
            )}
            {createUserWithProfileMutation.isError && (
              <div
                data-testid="profile-error"
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded"
              >
                <h4 className="font-semibold text-red-800">복합 생성 실패!</h4>
                <div className="text-sm mt-2 text-red-700">
                  {createUserWithProfileMutation.error?.message ||
                    "알 수 없는 오류"}
                </div>
              </div>
            )}
          </div>

          {/* 배치 업데이트 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">
              배치 업데이트 (Promise.allSettled 활용)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              여러 사용자를 동시에 업데이트합니다. 일부 실패해도 전체 작업이
              중단되지 않습니다.
            </p>
            <button
              data-testid="batch-update-btn"
              onClick={handleBatchUpdate}
              disabled={batchUpdateMutation.isPending}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-300"
            >
              {batchUpdateMutation.isPending
                ? "배치 업데이트 중..."
                : "배치 업데이트 실행"}
            </button>

            {/* 배치 업데이트 결과 */}
            {batchUpdateMutation.isSuccess && (
              <div
                data-testid="batch-success"
                className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded"
              >
                <h4 className="font-semibold text-indigo-800">
                  배치 업데이트 완료!
                </h4>
                <div className="text-sm mt-2 space-y-2">
                  <div className="text-indigo-700">
                    총 {batchUpdateMutation.data?.total}개 중{" "}
                    {batchUpdateMutation.data?.successCount}개 성공,{" "}
                    {batchUpdateMutation.data?.failureCount}개 실패
                  </div>
                  <details className="text-indigo-600">
                    <summary className="cursor-pointer">상세 결과 보기</summary>
                    <pre className="mt-2 bg-white p-2 rounded text-xs">
                      {JSON.stringify(batchUpdateMutation.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
            {batchUpdateMutation.isError && (
              <div
                data-testid="batch-error"
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded"
              >
                <h4 className="font-semibold text-red-800">
                  배치 업데이트 실패!
                </h4>
                <div className="text-sm mt-2 text-red-700">
                  {batchUpdateMutation.error?.message || "알 수 없는 오류"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 타임아웃 테스트 섹션 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">타임아웃 설정 테스트</h2>
          <p className="text-sm text-gray-600 mb-4">
            다양한 타임아웃 설정을 테스트할 수 있습니다. fetchConfig에서
            timeout을 개별적으로 설정할 수 있습니다.
          </p>

          <div className="space-y-4">
            {/* 느린 요청 테스트 */}
            <div>
              <h3 className="text-lg font-medium mb-2">
                느린 요청 테스트 (5초 타임아웃)
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                3초 지연으로 요청하므로 성공해야 합니다.
              </p>
              <button
                data-testid="slow-mutation-btn"
                onClick={handleSlowMutation}
                disabled={slowMutation.isPending}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
              >
                {slowMutation.isPending
                  ? "요청 중... (5초 타임아웃)"
                  : "느린 요청 테스트"}
              </button>

              {slowMutation.isSuccess && (
                <div
                  data-testid="slow-success"
                  className="mt-2 p-3 bg-green-50 border border-green-200 rounded"
                >
                  <span className="text-sm text-green-800">
                    ✅ 느린 요청 성공!
                  </span>
                </div>
              )}
              {slowMutation.isError && (
                <div
                  data-testid="slow-error"
                  className="mt-2 p-3 bg-red-50 border border-red-200 rounded"
                >
                  <span className="text-sm text-red-800">
                    ❌ 느린 요청 실패: {slowMutation.error?.message}
                  </span>
                </div>
              )}
            </div>

            {/* 빠른 타임아웃 테스트 */}
            <div>
              <h3 className="text-lg font-medium mb-2">
                빠른 타임아웃 테스트 (1초 타임아웃)
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                2초 지연으로 요청하므로 타임아웃 에러가 발생해야 합니다.
              </p>
              <button
                data-testid="fast-timeout-btn"
                onClick={handleFastTimeoutMutation}
                disabled={fastTimeoutMutation.isPending}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300"
              >
                {fastTimeoutMutation.isPending
                  ? "요청 중... (1초 타임아웃)"
                  : "빠른 타임아웃 테스트"}
              </button>

              {fastTimeoutMutation.isSuccess && (
                <div
                  data-testid="fast-timeout-success"
                  className="mt-2 p-3 bg-green-50 border border-green-200 rounded"
                >
                  <span className="text-sm text-green-800">
                    ✅ 빠른 타임아웃 요청 성공!
                  </span>
                </div>
              )}
              {fastTimeoutMutation.isError && (
                <div
                  data-testid="fast-timeout-error"
                  className="mt-2 p-3 bg-red-50 border border-red-200 rounded"
                >
                  <span className="text-sm text-red-800">
                    ❌ 예상된 타임아웃 에러:{" "}
                    {fastTimeoutMutation.error?.message}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 타임아웃 설정 코드 예제 */}
          <div className="mt-6 bg-gray-800 text-white p-4 rounded text-sm">
            <h4 className="font-semibold mb-2">타임아웃 설정 예제:</h4>
            <pre>{`// Factory에서 개별 타임아웃 설정
slowMutation: {
  url: "/api/slow-mutation",
  method: "POST",
  fetchConfig: {
    timeout: 5000, // 5초 타임아웃
  }
}

// 전역 기본 타임아웃 설정
setDefaultQueryClientOptions({
  timeout: 30000, // 30초 기본 타임아웃
  // ... 기타 설정
});`}</pre>
          </div>
        </div>

        {/* 타입 추론 확인 섹션 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">타입 추론 확인</h2>
          <div className="text-sm space-y-2 text-green-800">
            <div>
              ✅ <code>fetcher</code> 매개변수가 <code>NextTypeFetch</code>로
              올바르게 추론됨
            </div>
            <div>
              ✅ <code>variables</code> 타입이 각 mutation의 정의에 따라 정확히
              추론됨
            </div>
            <div>
              ✅ <code>error</code> 타입이{" "}
              <code>FetchError&lt;ApiErrorResponse&gt;</code>로 추론됨
            </div>
            <div>✅ 스키마 검증된 응답 데이터 타입이 자동으로 추론됨</div>
            <div>
              ✅ 단일 <code>(variables, fetcher)</code> 시그니처로 모든 케이스
              지원
            </div>
          </div>
        </div>

        {/* 전역 상태 표시 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">현재 Mutation 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>CREATE:</strong>{" "}
              {createUserMutation.isPending
                ? "⏳"
                : createUserMutation.isSuccess
                ? "✅"
                : createUserMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>UPDATE:</strong>{" "}
              {updateUserMutation.isPending
                ? "⏳"
                : updateUserMutation.isSuccess
                ? "✅"
                : updateUserMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>DELETE:</strong>{" "}
              {deleteUserMutation.isPending
                ? "⏳"
                : deleteUserMutation.isSuccess
                ? "✅"
                : deleteUserMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>PROFILE:</strong>{" "}
              {createUserWithProfileMutation.isPending
                ? "⏳"
                : createUserWithProfileMutation.isSuccess
                ? "✅"
                : createUserWithProfileMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>BATCH:</strong>{" "}
              {batchUpdateMutation.isPending
                ? "⏳"
                : batchUpdateMutation.isSuccess
                ? "✅"
                : batchUpdateMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>SLOW:</strong>{" "}
              {slowMutation.isPending
                ? "⏳"
                : slowMutation.isSuccess
                ? "✅"
                : slowMutation.isError
                ? "❌"
                : "⭕"}
            </div>
            <div>
              <strong>TIMEOUT:</strong>{" "}
              {fastTimeoutMutation.isPending
                ? "⏳"
                : fastTimeoutMutation.isSuccess
                ? "✅"
                : fastTimeoutMutation.isError
                ? "❌"
                : "⭕"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
