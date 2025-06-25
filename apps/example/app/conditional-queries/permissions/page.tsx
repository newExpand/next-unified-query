"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface UserPermissions {
  canViewSensitiveData: boolean;
  canEditUsers: boolean;
  canDeletePosts: boolean;
  role: string;
  permissions: string[];
  lastUpdated: string;
}

interface SensitiveData {
  id: number;
  title: string;
  content: string;
  classification: "confidential" | "secret" | "top-secret";
  owner: string;
  lastModified: string;
}

export default function PermissionsPage() {
  const [userId, setUserId] = useState<number>(1);

  // 1단계: 사용자 권한 확인 쿼리
  const {
    data: permissions,
    error: permissionsError,
    isLoading: isLoadingPermissions,
  } = useQuery<UserPermissions, any>({
    cacheKey: ["user-permissions", userId],
    queryFn: async (fetcher) => {
      console.log("🔍 사용자 권한 확인 중...", { userId, fetcher });

      const response = await fetcher.get<UserPermissions>(
        "/api/user-permissions", // 🎯 baseURL 적용 테스트
        {
          params: { userId },
        }
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1분간 fresh 상태 유지
  });

  // 2단계: 권한이 있을 때만 민감한 데이터 조회 (조건부 쿼리)
  const {
    data: sensitiveData,
    error: sensitiveError,
    isLoading: isLoadingSensitive,
    isFetching: isFetchingSensitive,
  } = useQuery<SensitiveData[]>({
    cacheKey: ["sensitive-data", userId],
    queryFn: async (fetcher) => {
      console.log("🔒 민감한 데이터 조회 중...", { userId, fetcher });

      const response = await fetcher.get<SensitiveData[]>(
        "/api/sensitive-data", // 🎯 baseURL 적용 테스트
        {
          params: { userId },
        }
      );
      return response.data;
    },
    enabled: !!permissions?.canViewSensitiveData, // 권한이 있을 때만 실행
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
  });

  const handleUserChange = (newUserId: number) => {
    setUserId(newUserId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="permissions-page"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            권한 기반 조건부 쿼리 (enabled 옵션)
          </h1>

          {/* 조건부 쿼리 설명 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">
              🔐 조건부 쿼리 동작
            </h3>
            <p className="text-blue-700 text-sm">
              1단계에서 사용자 권한을 확인하고, 권한이 있을 때만 2단계 민감한
              데이터를 조회합니다. 콘솔에서 실행 과정을 확인할 수 있습니다.
            </p>
          </div>

          {/* 사용자 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              테스트할 사용자 선택
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((id) => (
                <button
                  key={id}
                  onClick={() => handleUserChange(id)}
                  className={`px-4 py-2 rounded-md font-medium ${
                    userId === id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  data-testid={`user-${id}-btn`}
                >
                  사용자 {id}
                </button>
              ))}
            </div>
          </div>

          {/* 1단계: 권한 확인 결과 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1️⃣ 사용자 권한 확인
            </h2>

            {isLoadingPermissions ? (
              <div
                className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg"
                data-testid="permissions-loading"
              >
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500 mr-3"></div>
                  <span className="text-yellow-700">
                    권한 정보를 확인하는 중...
                  </span>
                </div>
              </div>
            ) : permissionsError ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  권한 확인 실패
                </h4>
                <p className="text-red-700 text-sm">
                  {permissionsError.message}
                </p>
              </div>
            ) : permissions ? (
              <div
                className={`border p-4 rounded-lg ${
                  permissions.canViewSensitiveData
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
                data-testid="permissions-result"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4
                    className={`font-medium ${
                      permissions.canViewSensitiveData
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {permissions.canViewSensitiveData
                      ? "✅ 접근 권한 있음"
                      : "❌ 접근 권한 없음"}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      permissions.canViewSensitiveData
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {permissions.role}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>사용자 ID:</strong> {userId}
                    </p>
                    <p>
                      <strong>마지막 업데이트:</strong>{" "}
                      {new Date(permissions.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>보유 권한:</strong>
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {permissions.permissions.map((perm, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 2단계: 조건부 민감한 데이터 조회 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2️⃣ 민감한 데이터 조회 (조건부 실행)
            </h2>

            {!permissions?.canViewSensitiveData ? (
              <div
                className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
                data-testid="query-disabled"
              >
                <h4 className="font-medium text-gray-600 mb-2">
                  🚫 쿼리 비활성화됨
                </h4>
                <p className="text-gray-600 text-sm">
                  권한이 없어서 민감한 데이터 쿼리가 실행되지 않습니다.
                  <code className="bg-gray-200 px-1 rounded">
                    enabled: false
                  </code>
                </p>
              </div>
            ) : isLoadingSensitive ? (
              <div
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                data-testid="sensitive-loading"
              >
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-blue-700">
                    민감한 데이터를 조회하는 중...
                  </span>
                </div>
              </div>
            ) : sensitiveError ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  데이터 조회 실패
                </h4>
                <p className="text-red-700 text-sm">{sensitiveError.message}</p>
              </div>
            ) : sensitiveData && sensitiveData.length > 0 ? (
              <div className="space-y-4" data-testid="sensitive-data">
                {sensitiveData.map((item) => (
                  <div
                    key={item.id}
                    className={`border p-4 rounded-lg ${
                      item.classification === "top-secret"
                        ? "bg-red-50 border-red-200"
                        : item.classification === "secret"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {item.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          item.classification === "top-secret"
                            ? "bg-red-100 text-red-800"
                            : item.classification === "secret"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.classification}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-2">{item.content}</p>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>소유자: {item.owner}</span>
                      <span>
                        수정일: {new Date(item.lastModified).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-gray-600">
                  조회할 수 있는 민감한 데이터가 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* 쿼리 상태 정보 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">📊 쿼리 상태 정보</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  1️⃣ 권한 쿼리 상태
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>로딩:</strong>{" "}
                    {isLoadingPermissions ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>에러:</strong> {permissionsError ? "있음" : "없음"}
                  </p>
                  <p>
                    <strong>데이터:</strong> {permissions ? "있음" : "없음"}
                  </p>
                  <p>
                    <strong>캐시 키:</strong> ["user-permissions", {userId}]
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">
                  2️⃣ 민감 데이터 쿼리 상태
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>활성화:</strong>{" "}
                    {permissions?.canViewSensitiveData ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>로딩:</strong>{" "}
                    {isLoadingSensitive ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>패칭:</strong>{" "}
                    {isFetchingSensitive ? "예" : "아니오"}
                  </p>
                  <p>
                    <strong>에러:</strong> {sensitiveError ? "있음" : "없음"}
                  </p>
                  <p>
                    <strong>데이터:</strong>{" "}
                    {sensitiveData ? `${sensitiveData.length}개` : "없음"}
                  </p>
                </div>
              </div>
            </div>

            {/* enabled 옵션 설명 */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3">
                💡 enabled 옵션 활용
              </h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>
                  • <strong>조건부 실행:</strong>{" "}
                  <code>enabled: !!permissions?.hasAccess</code>로 권한 확인 후
                  실행
                </p>
                <p>
                  • <strong>연쇄 쿼리:</strong> 첫 번째 쿼리 결과를 바탕으로 두
                  번째 쿼리 실행 여부 결정
                </p>
                <p>
                  • <strong>성능 최적화:</strong> 불필요한 API 호출 방지
                </p>
                <p>
                  • <strong>사용자 경험:</strong> 권한이 없으면 로딩 없이 즉시
                  안내 메시지 표시
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
