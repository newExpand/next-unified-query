"use client";

import { useQuery, useMutation } from "../../lib/query-client";
import { useState, useEffect } from "react";

// 토큰 기반 인증 테스트 페이지
export default function TokenTestPage() {
  const [token, setToken] = useState<string>("");
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 마운트 후 토큰 상태 초기화
  useEffect(() => {
    setMounted(true);
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);
  
  // 사용자 프로필 조회 쿼리
  const { data: userProfile, refetch: refetchProfile, isLoading: isProfileLoading } = useQuery({
    cacheKey: ["user-profile"],
    queryFn: async (fetcher) => {
      const response = await fetcher.get("/api/user/profile");
      return response.data;
    },
    enabled: false // 수동 실행
  });
  
  // 토큰 갱신 뮤테이션
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setApiResults(prev => [...prev, { type: "refresh", data, timestamp: Date.now() }]);
    }
  });
  
  // 토큰 검증 뮤테이션
  const validateTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/auth/token-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setApiResults(prev => [...prev, { type: "validation", data, timestamp: Date.now() }]);
    }
  });
  
  // 토큰 설정
  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setToken(accessToken);
  };
  
  // 토큰 제거
  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken("");
    setApiResults([]);
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">토큰 인증 테스트</h1>
      
      {/* 토큰 설정 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">토큰 설정</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => setTokens("valid-access-token", "valid-refresh-token")}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              data-testid="set-valid-tokens-btn"
            >
              유효한 토큰 설정
            </button>
            <button
              onClick={() => setTokens("expired-access-token", "valid-refresh-token")}
              className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
              data-testid="set-expired-token-btn"
            >
              만료된 토큰 설정
            </button>
            <button
              onClick={clearTokens}
              className="bg-red-500 text-white px-4 py-2 rounded"
              data-testid="clear-tokens-btn"
            >
              토큰 제거
            </button>
          </div>
          <div>
            <span className="font-medium">현재 토큰: </span>
            <span data-testid="current-token">
              {!mounted ? "없음" : (token || "없음")}
            </span>
          </div>
        </div>
      </div>
      
      {/* API 테스트 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">API 테스트</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => refetchProfile()}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              data-testid="fetch-profile-btn"
              disabled={isProfileLoading}
            >
              {isProfileLoading ? "로딩 중..." : "프로필 조회"}
            </button>
            <button
              onClick={() => refreshTokenMutation.mutate()}
              className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
              data-testid="refresh-token-btn"
              disabled={refreshTokenMutation.isPending}
            >
              {refreshTokenMutation.isPending ? "갱신 중..." : "토큰 갱신"}
            </button>
            <button
              onClick={() => validateTokenMutation.mutate(token)}
              className="bg-orange-500 text-white px-4 py-2 rounded"
              data-testid="validate-token-btn"
              disabled={validateTokenMutation.isPending}
            >
              {validateTokenMutation.isPending ? "검증 중..." : "토큰 검증"}
            </button>
          </div>
        </div>
      </div>
      
      {/* 사용자 프로필 표시 */}
      {userProfile && (
        <div className="bg-green-50 p-6 rounded-lg mb-6" data-testid="user-profile">
          <h2 className="text-xl font-semibold mb-4">사용자 프로필</h2>
          <div>
            <p><span className="font-medium">이름:</span> <span data-testid="user-name">{userProfile.name}</span></p>
            <p><span className="font-medium">이메일:</span> <span data-testid="user-email">{userProfile.email}</span></p>
            <p><span className="font-medium">ID:</span> <span data-testid="user-id">{userProfile.id}</span></p>
          </div>
        </div>
      )}
      
      {/* API 결과 로그 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API 결과 로그</h2>
        <div className="space-y-2" data-testid="api-results">
          {apiResults.length === 0 ? (
            <p className="text-gray-500">아직 API 호출 결과가 없습니다.</p>
          ) : (
            apiResults.map((result, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded border"
                data-testid={`api-result-${index}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-blue-600">{result.type}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}