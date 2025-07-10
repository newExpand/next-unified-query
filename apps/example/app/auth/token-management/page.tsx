"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "../../lib/query-client";

// 토큰 관리 및 자동 갱신 데모 페이지
export default function TokenManagementPage() {
  const queryClient = useQueryClient();
  const [interceptorsActive, setInterceptorsActive] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<"valid" | "expired" | "none">(
    "none"
  );
  const [logs, setLogs] = useState<string[]>([]);

  // 로그 추가 함수
  const addLog = (message: string) => {
    setLogs((prev) => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  // 토큰 상태 확인
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setTokenStatus("none");
      } else if (token.includes("expired")) {
        setTokenStatus("expired");
      } else {
        setTokenStatus("valid");
      }
    }
  }, []);

  // 인터셉터 설정 (이미 api.ts에서 설정되어 있으므로 시뮬레이션)
  const setupInterceptors = () => {
    // 실제로는 이미 api.ts에서 인터셉터가 설정되어 있음
    // 여기서는 사용자에게 설정되었다는 피드백만 제공
    setInterceptorsActive(true);
    addLog("인터셉터 설정 완료 (Auth Retry 포함)");
    addLog("요청 인터셉터: Authorization 헤더 자동 추가 활성화");
    addLog("응답 인터셉터: 401 에러 시 토큰 자동 갱신 활성화");
  };

  // 사용자 프로필 쿼리
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    cacheKey: ["user-profile"],
    queryFn: async (fetcher) => {
      addLog("사용자 프로필 API 호출");
      const response = await fetcher.get("/api/user/profile");
      return response.data;
    },
    enabled: false,
  });

  // 대시보드 데이터 쿼리
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    cacheKey: ["dashboard-data"],
    queryFn: async (fetcher) => {
      addLog("대시보드 데이터 API 호출");
      const response = await fetcher.get("/api/dashboard/data");
      return response.data;
    },
    enabled: false,
  });

  // 토큰 갱신 뮤테이션
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setTokenStatus("valid");
      addLog("토큰 갱신 성공");
    },
    onError: (error) => {
      addLog(`토큰 갱신 실패: ${error.message}`);
      setTokenStatus("none");
    },
  });

  // 토큰 설정 함수들
  const setValidTokens = () => {
    localStorage.setItem("accessToken", "valid-access-token");
    localStorage.setItem("refreshToken", "valid-refresh-token");
    setTokenStatus("valid");
    addLog("유효한 토큰 설정");
  };

  const setExpiredTokens = () => {
    localStorage.setItem("accessToken", "expired-access-token");
    localStorage.setItem("refreshToken", "valid-refresh-token");
    setTokenStatus("expired");
    addLog("만료된 토큰 설정");
  };

  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setTokenStatus("none");
    queryClient.clear();
    addLog("토큰 제거 및 캐시 초기화");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">토큰 관리 시스템</h1>

      {/* 인터셉터 상태 */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">인터셉터 상태</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                interceptorsActive ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span data-testid="interceptor-status">
              {interceptorsActive ? "활성" : "비활성"}
            </span>
          </div>
          <button
            onClick={setupInterceptors}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            data-testid="setup-interceptors-btn"
            disabled={interceptorsActive}
          >
            인터셉터 설정
          </button>
        </div>
      </div>

      {/* 토큰 상태 및 관리 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">토큰 상태</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  tokenStatus === "valid"
                    ? "bg-green-500"
                    : tokenStatus === "expired"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span data-testid="token-status">
                {tokenStatus === "valid"
                  ? "유효함"
                  : tokenStatus === "expired"
                  ? "만료됨"
                  : "없음"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Access Token:{" "}
              <span data-testid="access-token">
                {(typeof window !== "undefined"
                  ? localStorage.getItem("accessToken")
                  : null) || "없음"}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={setValidTokens}
              className="bg-green-500 text-white px-4 py-2 rounded"
              data-testid="set-valid-tokens-btn"
            >
              유효한 토큰 설정
            </button>
            <button
              onClick={setExpiredTokens}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
              data-testid="set-expired-tokens-btn"
            >
              만료된 토큰 설정
            </button>
            <button
              onClick={() => refreshTokenMutation.mutate()}
              className="bg-purple-500 text-white px-4 py-2 rounded"
              data-testid="refresh-token-btn"
              disabled={refreshTokenMutation.isPending}
            >
              {refreshTokenMutation.isPending ? "갱신 중..." : "토큰 갱신"}
            </button>
            <button
              onClick={clearTokens}
              className="bg-red-500 text-white px-4 py-2 rounded"
              data-testid="clear-tokens-btn"
            >
              토큰 제거
            </button>
          </div>
        </div>
      </div>

      {/* API 테스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">사용자 프로필</h3>
          <div className="space-y-4">
            <button
              onClick={() => refetchProfile()}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              data-testid="fetch-profile-btn"
              disabled={isProfileLoading}
            >
              {isProfileLoading ? "로딩 중..." : "프로필 조회"}
            </button>

            {userProfile && (
              <div
                className="bg-green-50 p-4 rounded"
                data-testid="user-profile"
              >
                <p>
                  <span className="font-medium">이름:</span>{" "}
                  <span data-testid="user-name">{userProfile.name}</span>
                </p>
                <p>
                  <span className="font-medium">이메일:</span>{" "}
                  <span data-testid="user-email">{userProfile.email}</span>
                </p>
              </div>
            )}

            {profileError && (
              <div
                className="bg-red-50 p-4 rounded"
                data-testid="profile-error"
              >
                <p className="text-red-600">에러: {profileError.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">대시보드 데이터</h3>
          <div className="space-y-4">
            <button
              onClick={() => refetchDashboard()}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              data-testid="fetch-dashboard-btn"
              disabled={isDashboardLoading}
            >
              {isDashboardLoading ? "로딩 중..." : "대시보드 조회"}
            </button>

            {dashboardData && (
              <div
                className="bg-green-50 p-4 rounded"
                data-testid="dashboard-data"
              >
                <p>
                  <span className="font-medium">활성 사용자:</span>{" "}
                  {dashboardData.activeUsers}
                </p>
                <p>
                  <span className="font-medium">총 사용자:</span>{" "}
                  {dashboardData.totalUsers}
                </p>
              </div>
            )}

            {dashboardError && (
              <div
                className="bg-red-50 p-4 rounded"
                data-testid="dashboard-error"
              >
                <p className="text-red-600">에러: {dashboardError.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 로그 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">시스템 로그</h3>
          <button
            onClick={clearLogs}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
            data-testid="clear-logs-btn"
          >
            로그 지우기
          </button>
        </div>
        <div
          className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto"
          data-testid="system-logs"
        >
          {logs.length === 0 ? (
            <p>로그가 없습니다.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
