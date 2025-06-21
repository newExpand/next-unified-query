"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface User {
  id: number;
  name: string;
  email: string;
  accessLevel?: string;
}

export default function EnabledConditions() {
  const [userId, setUserId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [enableMode, setEnableMode] = useState<"simple" | "complex">("simple");

  // 단순 조건: 사용자 ID가 있을 때만 실행
  const { data: userSimple, isLoading: loadingSimple } = useQuery<User>({
    cacheKey: ["user", "simple", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("User not found");
      }
      return response.json();
    },
    enabled: enableMode === "simple" && !!userId && userId.length > 0,
  });

  // 복합 조건: 로그인 + 권한 + 사용자 ID
  const { data: userComplex, isLoading: loadingComplex } = useQuery<User>({
    cacheKey: ["user", "complex", userId, isLoggedIn, hasPermission],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}?mode=complex`, {
        headers: {
          Authorization: isLoggedIn ? "Bearer valid-token" : "",
          "X-Has-Permission": hasPermission ? "true" : "false",
        },
      });
      if (!response.ok) {
        throw new Error("Access denied or user not found");
      }
      return response.json();
    },
    enabled:
      enableMode === "complex" &&
      !!userId &&
      userId.length > 0 &&
      isLoggedIn &&
      hasPermission,
  });

  // 현재 모드에 따른 데이터와 로딩 상태
  const currentData = enableMode === "simple" ? userSimple : userComplex;
  const isLoading = enableMode === "simple" ? loadingSimple : loadingComplex;

  // 조건 충족 여부 계산
  const simpleConditionMet = !!userId && userId.length > 0;
  const complexConditionMet =
    !!userId && userId.length > 0 && isLoggedIn && hasPermission;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Enabled 조건 테스트
          </h1>

          <div className="space-y-6">
            {/* 모드 선택 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                테스트 모드
              </h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => setEnableMode("simple")}
                  className={`px-4 py-2 rounded ${
                    enableMode === "simple"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid="simple-mode-btn"
                >
                  단순 조건 (ID만)
                </button>
                <button
                  onClick={() => setEnableMode("complex")}
                  className={`px-4 py-2 rounded ${
                    enableMode === "complex"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  data-testid="complex-mode-btn"
                >
                  복합 조건 (ID + 로그인 + 권한)
                </button>
              </div>
            </div>

            {/* 사용자 ID 입력 */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                사용자 ID
              </h2>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="1, 2, 3 등의 숫자 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="user-id-input"
              />
            </div>

            {/* 복합 조건용 추가 설정 */}
            {enableMode === "complex" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    추가 조건
                  </h2>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isLoggedIn}
                        onChange={(e) => setIsLoggedIn(e.target.checked)}
                        className="mr-2"
                        data-testid="login-checkbox"
                      />
                      로그인 상태
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasPermission}
                        onChange={(e) => setHasPermission(e.target.checked)}
                        className="mr-2"
                        data-testid="permission-checkbox"
                      />
                      권한 보유
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 조건 상태 표시 */}
        <div
          className="bg-white shadow rounded-lg p-6"
          data-testid="condition-status"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">조건 상태</h2>

          <div className="space-y-2 text-sm">
            <p>
              <strong>현재 모드:</strong>{" "}
              {enableMode === "simple" ? "단순 조건" : "복합 조건"}
            </p>
            <p>
              <strong>사용자 ID:</strong> {userId || "(입력되지 않음)"}
            </p>

            {enableMode === "simple" ? (
              <div>
                <p>
                  <strong>단순 조건 충족:</strong>{" "}
                  {simpleConditionMet ? "✅ 예" : "❌ 아니오"}
                </p>
                <p className="text-gray-600">조건: 사용자 ID가 입력되어야 함</p>
              </div>
            ) : (
              <div>
                <p>
                  <strong>복합 조건 충족:</strong>{" "}
                  {complexConditionMet ? "✅ 예" : "❌ 아니오"}
                </p>
                <div className="text-gray-600 space-y-1">
                  <p>조건 1: 사용자 ID 입력 {userId ? "✅" : "❌"}</p>
                  <p>조건 2: 로그인 상태 {isLoggedIn ? "✅" : "❌"}</p>
                  <p>조건 3: 권한 보유 {hasPermission ? "✅" : "❌"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 쿼리 실행 상태 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            쿼리 실행 상태
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">쿼리 활성화:</span>
              <span
                className={`text-sm px-2 py-1 rounded ${
                  (
                    enableMode === "simple"
                      ? simpleConditionMet
                      : complexConditionMet
                  )
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {(
                  enableMode === "simple"
                    ? simpleConditionMet
                    : complexConditionMet
                )
                  ? "활성화됨"
                  : "비활성화됨"}
              </span>
            </div>

            {isLoading && (
              <div className="text-blue-600" data-testid="loading-status">
                <p>데이터를 불러오는 중...</p>
              </div>
            )}

            {currentData && (
              <div
                className="bg-green-50 border border-green-200 rounded p-4"
                data-testid="user-data-loaded"
              >
                <h3 className="font-medium text-green-900 mb-2">
                  사용자 데이터 로드 성공
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>ID:</strong> {currentData.id}
                  </p>
                  <p>
                    <strong>이름:</strong> {currentData.name}
                  </p>
                  <p>
                    <strong>이메일:</strong> {currentData.email}
                  </p>
                  {currentData.accessLevel && (
                    <p>
                      <strong>접근 레벨:</strong> {currentData.accessLevel}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isLoading &&
              !currentData &&
              (enableMode === "simple"
                ? simpleConditionMet
                : complexConditionMet) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-800">
                    조건은 충족되었지만 데이터를 불러오지 못했습니다.
                  </p>
                </div>
              )}

            {!(enableMode === "simple"
              ? simpleConditionMet
              : complexConditionMet) && (
              <div
                className="bg-gray-50 border border-gray-200 rounded p-4"
                data-testid="query-disabled"
              >
                <p className="text-gray-600">
                  {enableMode === "simple"
                    ? "사용자 ID를 입력하면 쿼리가 실행됩니다."
                    : "모든 조건을 충족하면 쿼리가 실행됩니다."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Enabled 조건의 활용
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>단순 조건:</strong> 하나의 값이 존재할 때만 쿼리 실행 (예:
              ID가 있을 때)
            </p>
            <p>
              <strong>복합 조건:</strong> 여러 조건이 모두 만족될 때만 쿼리 실행
              (예: 인증 + 권한)
            </p>
            <p>
              <strong>성능 최적화:</strong> 불필요한 API 호출을 방지하여
              네트워크 리소스 절약
            </p>
            <p>
              <strong>사용자 경험:</strong> 조건이 충족되지 않은 상태에서는 로딩
              상태를 보여주지 않음
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
